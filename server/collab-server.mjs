import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const PORT = parseInt(process.env.COLLAB_PORT || "3001", 10);

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "undangan-collab-ws" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

/**
 * Room Map: draftId -> {
 *   clients: Set<WebSocket>,
 *   presences: Map<connectionId, Presence>
 * }
 */
const rooms = new Map();

function getOrCreateRoom(draftId) {
  let room = rooms.get(draftId);
  if (!room) {
    room = {
      clients: new Set(),
      presences: new Map(),
    };
    rooms.set(draftId, room);
  }
  return room;
}

function broadcastToRoom(draftId, message, senderWs = null) {
  const room = rooms.get(draftId);
  if (!room) return;

  const payload = typeof message === "string" ? message : JSON.stringify(message);
  for (const client of room.clients) {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws, req) => {
  let currentDraftId = null;
  let currentConnectionId = null;
  let currentUserId = null;
  let isAlive = true;

  ws.on("pong", () => {
    isAlive = true;
  });

  // Extract query parameters: /?draftId=...&connectionId=...
  try {
    const url = new URL(req.url, "http://localhost");
    currentDraftId = url.searchParams.get("draftId");
    currentConnectionId = url.searchParams.get("connectionId");
  } catch {}

  if (currentDraftId) {
    const room = getOrCreateRoom(currentDraftId);
    room.clients.add(ws);

    // Send immediate sync snapshot of current online users in room
    ws.send(JSON.stringify({
      type: "sync",
      presences: Array.from(room.presences.values()),
    }));
  }

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "join") {
        currentDraftId = msg.draftId;
        currentConnectionId = msg.presence.connectionId;
        currentUserId = msg.presence.userId;

        const room = getOrCreateRoom(currentDraftId);
        room.clients.add(ws);
        room.presences.set(currentConnectionId, msg.presence);

        // Send full sync to new joiner
        ws.send(JSON.stringify({
          type: "sync",
          presences: Array.from(room.presences.values()),
        }));

        // Broadcast join to other peers
        broadcastToRoom(currentDraftId, {
          type: "join",
          presence: msg.presence,
        }, ws);
      } else if (msg.type === "presence.update") {
        if (!currentDraftId) return;
        const room = getOrCreateRoom(currentDraftId);
        room.presences.set(msg.presence.connectionId, msg.presence);

        broadcastToRoom(currentDraftId, {
          type: "update",
          presence: msg.presence,
        }, ws);
      } else if (msg.type === "cursor") {
        if (!currentDraftId) return;
        broadcastToRoom(currentDraftId, {
          type: "cursor",
          connectionId: currentConnectionId,
          userId: currentUserId,
          cursor: msg.cursor,
          updatedAt: Date.now(),
        }, ws);
      } else if (msg.type === "revoke") {
        if (!currentDraftId) return;
        broadcastToRoom(currentDraftId, {
          type: "revoked",
          userId: msg.targetUserId,
          reason: msg.reason || "Akses dicabut oleh pemilik.",
        });
      }
    } catch (err) {
      console.error("[WS] Message error:", err.message);
    }
  });

  ws.on("close", () => {
    if (currentDraftId && currentConnectionId) {
      const room = rooms.get(currentDraftId);
      if (room) {
        room.clients.delete(ws);
        room.presences.delete(currentConnectionId);

        broadcastToRoom(currentDraftId, {
          type: "leave",
          connectionId: currentConnectionId,
          userId: currentUserId,
        });

        if (room.clients.size === 0) {
          rooms.delete(currentDraftId);
        }
      }
    }
  });

  ws.on("error", () => {
    ws.terminate();
  });
});

// Ping-pong interval to clean dead connections
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    ws.ping();
  });
}, 20_000);

wss.on("close", () => {
  clearInterval(pingInterval);
});

server.listen(PORT, () => {
  console.log(`[Collab WebSocket Server] Running on ws://localhost:${PORT}`);
});
