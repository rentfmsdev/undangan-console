import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import * as Y from "yjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const PORT = parseInt(process.env.COLLAB_PORT || "3001", 10);
const DB_URL = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/undangan_console";

let dbPool = null;
try {
  dbPool = mysql.createPool(DB_URL);
} catch (e) {
  console.warn("[Collab Server] MySQL connection pool initialization warning:", e.message);
}

const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "undangan-collab-ws", time: Date.now() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

/**
 * Room Map: draftId -> {
 *   clients: Set<WebSocket>,
 *   presences: Map<connectionId, Presence>,
 *   ydoc: Y.Doc,
 *   revision: number,
 *   isDirty: boolean,
 *   debounceTimer: NodeJS.Timeout | null,
 *   forcedTimer: NodeJS.Timeout | null
 * }
 */
const rooms = new Map();

async function loadRoomSnapshot(draftId, ydoc) {
  if (!dbPool) return 1;
  try {
    // 1. Try to load newest snapshot from invitation_collaboration_snapshots
    const [snapRows] = await dbPool.query(
      "SELECT revision, snapshot FROM invitation_collaboration_snapshots WHERE invitation_id = ? ORDER BY revision DESC LIMIT 1",
      [draftId]
    );

    if (snapRows && snapRows.length > 0) {
      const snap = snapRows[0];
      const updateBuffer = Buffer.from(snap.snapshot, "base64");
      Y.applyUpdate(ydoc, updateBuffer);
      return Number(snap.revision) + 1;
    }

    // 2. Fallback: load from invitations and invitation_sections
    const [invRows] = await dbPool.query("SELECT * FROM invitations WHERE id = ? LIMIT 1", [draftId]);
    if (invRows && invRows.length > 0) {
      const inv = invRows[0];
      let styleOverrides = {};
      try {
        styleOverrides = typeof inv.style_overrides === "string" ? JSON.parse(inv.style_overrides) : (inv.style_overrides || {});
      } catch {}
      const [secRows] = await dbPool.query("SELECT * FROM invitation_sections WHERE invitation_id = ? ORDER BY section_order ASC", [draftId]);

      ydoc.transact(() => {
        const metadata = ydoc.getMap("metadata");
        metadata.set("templateId", inv.template_id || "hjydg");
        metadata.set("schemaVersion", 1);
        metadata.set("updatedAt", Date.now());

        const globalSettings = ydoc.getMap("globalSettings");
        globalSettings.set("themeId", inv.theme_id || "royal-blue-gold");
        globalSettings.set("musicUrl", styleOverrides.musicUrl || "/assets/audio/easy-on-me.webm");
        globalSettings.set("musicVolume", typeof styleOverrides.musicVolume === "number" ? styleOverrides.musicVolume : 0.6);

        const sectionOrder = ydoc.getArray("sectionOrder");
        const sectionsMap = ydoc.getMap("sections");

        for (const sec of secRows) {
          sectionOrder.push([sec.id]);
          const secMap = new Y.Map();
          secMap.set("id", sec.id);
          secMap.set("type", sec.type);
          secMap.set("enabled", Boolean(sec.enabled));

          let parsedData = {};
          try {
            parsedData = typeof sec.data === "string" ? JSON.parse(sec.data) : (sec.data || {});
          } catch {}

          const dataMap = new Y.Map();
          Object.entries(parsedData).forEach(([k, v]) => dataMap.set(k, v));
          secMap.set("data", dataMap);
          sectionsMap.set(sec.id, secMap);
        }
      });
    }
    return 1;
  } catch (err) {
    console.error(`[Collab Server] Error loading snapshot for ${draftId}:`, err.message);
    return 1;
  }
}

async function flushRoomSnapshot(room, draftId, createdBy = null) {
  if (!dbPool || !room.isDirty) return;
  room.isDirty = false;

  if (room.debounceTimer) clearTimeout(room.debounceTimer);
  if (room.forcedTimer) clearTimeout(room.forcedTimer);
  room.debounceTimer = null;
  room.forcedTimer = null;

  try {
    const currentRevision = room.revision++;
    const stateUpdate = Buffer.from(Y.encodeStateAsUpdate(room.ydoc)).toString("base64");
    const snapId = randomUUID();

    await dbPool.query(
      "INSERT INTO invitation_collaboration_snapshots (id, invitation_id, revision, schema_version, snapshot, created_by) VALUES (?, ?, ?, 1, ?, ?)",
      [snapId, draftId, currentRevision, stateUpdate, createdBy]
    );

    // Keep invitations.theme_id, invitations.style_overrides and invitations.updated_at synchronized
    const globalSettings = room.ydoc.getMap("globalSettings");
    const themeId = globalSettings.get("themeId");
    const musicUrl = globalSettings.get("musicUrl");
    const musicVolume = globalSettings.get("musicVolume");

    const [invRows] = await dbPool.query("SELECT style_overrides FROM invitations WHERE id = ? LIMIT 1", [draftId]);
    let styleOverrides = {};
    if (invRows && invRows[0] && invRows[0].style_overrides) {
      try {
        styleOverrides = typeof invRows[0].style_overrides === "string" ? JSON.parse(invRows[0].style_overrides) : (invRows[0].style_overrides || {});
      } catch {}
    }
    if (musicUrl !== undefined) styleOverrides.musicUrl = musicUrl;
    if (typeof musicVolume === "number") styleOverrides.musicVolume = musicVolume;

    await dbPool.query(
      "UPDATE invitations SET theme_id = ?, style_overrides = ?, updated_at = NOW() WHERE id = ?",
      [themeId || null, JSON.stringify(styleOverrides), draftId]
    );

    console.log(`[Collab Server] Persisted durable snapshot for ${draftId} (rev ${currentRevision})`);
  } catch (err) {
    console.error(`[Collab Server] Failed to flush snapshot for ${draftId}:`, err.message);
  }
}

function scheduleSnapshotFlush(room, draftId, userId) {
  room.isDirty = true;

  // 2-second debounce
  if (room.debounceTimer) clearTimeout(room.debounceTimer);
  room.debounceTimer = setTimeout(() => {
    void flushRoomSnapshot(room, draftId, userId);
  }, 2000);

  // 10-second forced flush limit
  if (!room.forcedTimer) {
    room.forcedTimer = setTimeout(() => {
      void flushRoomSnapshot(room, draftId, userId);
    }, 10_000);
  }
}

async function getOrCreateRoom(draftId) {
  let room = rooms.get(draftId);
  if (!room) {
    const ydoc = new Y.Doc();
    const initialRev = await loadRoomSnapshot(draftId, ydoc);

    room = {
      clients: new Set(),
      presences: new Map(),
      ydoc,
      revision: initialRev,
      isDirty: false,
      debounceTimer: null,
      forcedTimer: null,
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

wss.on("connection", async (ws, req) => {
  let currentDraftId = null;
  let currentConnectionId = null;
  let currentUserId = null;
  let isAlive = true;

  ws.on("pong", () => {
    isAlive = true;
  });

  try {
    const url = new URL(req.url, "http://localhost");
    currentDraftId = url.searchParams.get("draftId");
    currentConnectionId = url.searchParams.get("connectionId");
  } catch {}

  if (currentDraftId) {
    const room = await getOrCreateRoom(currentDraftId);
    room.clients.add(ws);

    // Send immediate sync snapshot of presence
    ws.send(JSON.stringify({
      type: "sync",
      presences: Array.from(room.presences.values()),
    }));

    // Send initial Yjs document state
    const docState = Buffer.from(Y.encodeStateAsUpdate(room.ydoc)).toString("base64");
    ws.send(JSON.stringify({
      type: "doc.init",
      update: docState,
      revision: room.revision,
    }));
  }

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "join") {
        currentDraftId = msg.draftId;
        currentConnectionId = msg.presence.connectionId;
        currentUserId = msg.presence.userId;

        const room = await getOrCreateRoom(currentDraftId);
        room.clients.add(ws);
        room.presences.set(currentConnectionId, msg.presence);

        // Send full presence sync
        ws.send(JSON.stringify({
          type: "sync",
          presences: Array.from(room.presences.values()),
        }));

        // Send full Yjs document snapshot
        const docState = Buffer.from(Y.encodeStateAsUpdate(room.ydoc)).toString("base64");
        ws.send(JSON.stringify({
          type: "doc.init",
          update: docState,
          revision: room.revision,
        }));

        // Broadcast join to peers
        broadcastToRoom(currentDraftId, {
          type: "join",
          presence: msg.presence,
        }, ws);
      } else if (msg.type === "presence.update") {
        if (!currentDraftId) return;
        const room = await getOrCreateRoom(currentDraftId);
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
      } else if (msg.type === "doc.update") {
        if (!currentDraftId || !msg.update) return;
        const room = await getOrCreateRoom(currentDraftId);

        // Security check: Block update if client has 'viewer' role
        const senderPresence = room.presences.get(currentConnectionId);
        if (senderPresence && senderPresence.role === "viewer") {
          console.warn(`[Collab Server] Blocked doc.update from viewer (${currentUserId}) in ${currentDraftId}`);
          return;
        }

        // Apply incoming Yjs binary update to room's shared document
        const updateBuffer = Buffer.from(msg.update, "base64");
        Y.applyUpdate(room.ydoc, updateBuffer);

        // Schedule debounced MySQL snapshot persistence
        scheduleSnapshotFlush(room, currentDraftId, currentUserId);

        // Broadcast update to all other collaborators in this draft room
        broadcastToRoom(currentDraftId, {
          type: "doc.update",
          update: msg.update,
          originConnectionId: currentConnectionId,
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

  ws.on("close", async () => {
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

        // If everyone left the room -> immediate final snapshot flush!
        if (room.clients.size === 0) {
          await flushRoomSnapshot(room, currentDraftId, currentUserId);
          rooms.delete(currentDraftId);
        }
      }
    }
  });

  ws.on("error", () => {
    ws.terminate();
  });
});

// Clean dead connections
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    ws.ping();
  });
}, 20_000);

wss.on("close", () => {
  clearInterval(pingInterval);
});

server.listen(PORT, () => {
  console.log(`[Collab WebSocket Server with Yjs CRDT] Running on ws://localhost:${PORT}`);
});
