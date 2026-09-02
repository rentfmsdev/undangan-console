import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import * as Y from "yjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const PORT = Number.parseInt(process.env.COLLAB_PORT || "3001", 10);
const DB_URL = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/undangan_console";
const SESSION_COOKIE_NAME = "undangan_session";
const MAX_DOCUMENT_UPDATE_BYTES = 1_000_000;
const VALID_SURFACES = new Set(["canvas", "preview", "left-sidebar", "right-sidebar"]);
const DRAFT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dbPool = mysql.createPool(DB_URL);
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "undangan-collab-ws", time: Date.now() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => {
      const index = part.indexOf("=");
      return index < 0 ? [part.trim(), ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }).filter(([key]) => key)
  );
}

function colorForUser(userId) {
  const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4", "#F97316", "#6366F1"];
  let hash = 0;
  for (const char of userId) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

function safeString(value, maximum = 160) {
  return typeof value === "string" ? value.slice(0, maximum) : null;
}

function safeSurface(value) {
  return VALID_SURFACES.has(value) ? value : "canvas";
}

function safeCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(-10_000, Math.min(10_000, Math.round(number))) : 0;
}

function jsonFromY(value) {
  if (value instanceof Y.Map) {
    const next = {};
    value.forEach((item, key) => { next[key] = jsonFromY(item); });
    return next;
  }
  if (value instanceof Y.Array) return value.toArray().map(jsonFromY);
  return value;
}

async function resolvePrincipal(cookieHeader, draftId) {
  const sessionToken = parseCookies(cookieHeader)[SESSION_COOKIE_NAME];
  if (!sessionToken || !DRAFT_ID_PATTERN.test(draftId)) return null;

  const [sessionRows] = await dbPool.query(
    `SELECT u.id, u.email, u.name, u.avatar_url AS avatarUrl
     FROM sessions s INNER JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > NOW() LIMIT 1`,
    [sessionToken]
  );
  const user = sessionRows[0];
  if (!user) return null;

  const [draftRows] = await dbPool.query("SELECT user_id AS userId FROM invitations WHERE id = ? LIMIT 1", [draftId]);
  const draft = draftRows[0];
  if (!draft) return null;
  if (draft.userId === user.id) return { ...user, role: "owner" };

  const [membershipRows] = await dbPool.query(
    `SELECT role FROM invitation_collaborators
     WHERE invitation_id = ? AND status = 'accepted' AND (user_id = ? OR email = ?)
     LIMIT 1`,
    [draftId, user.id, user.email]
  );
  const membership = membershipRows[0];
  if (!membership || !["editor", "viewer"].includes(membership.role)) return null;
  return { ...user, role: membership.role };
}

function createPresence(principal, connectionId, input = {}) {
  return {
    connectionId,
    userId: principal.id,
    name: principal.name,
    email: principal.email,
    avatarUrl: principal.avatarUrl ?? null,
    color: colorForUser(principal.id),
    role: principal.role,
    state: input.state === "idle" ? "idle" : "active",
    surface: safeSurface(input.surface),
    sectionId: safeString(input.sectionId, 80),
    fieldPath: safeString(input.fieldPath, 180),
    lastSeenAt: Date.now(),
  };
}

async function loadRoomSnapshot(draftId, ydoc) {
  const [snapRows] = await dbPool.query(
    "SELECT revision, snapshot FROM invitation_collaboration_snapshots WHERE invitation_id = ? ORDER BY revision DESC LIMIT 1",
    [draftId]
  );
  if (snapRows.length) {
    Y.applyUpdate(ydoc, Buffer.from(snapRows[0].snapshot, "base64"));
    return Number(snapRows[0].revision) + 1;
  }

  const [invRows] = await dbPool.query("SELECT theme_id AS themeId, style_overrides AS styleOverrides, template_id AS templateId FROM invitations WHERE id = ? LIMIT 1", [draftId]);
  if (!invRows.length) throw new Error("Draft tidak ditemukan");
  const inv = invRows[0];
  const [secRows] = await dbPool.query("SELECT id, type, enabled, data FROM invitation_sections WHERE invitation_id = ? ORDER BY section_order ASC", [draftId]);
  let overrides = {};
  try { overrides = typeof inv.styleOverrides === "string" ? JSON.parse(inv.styleOverrides || "{}") : (inv.styleOverrides || {}); } catch {}

  ydoc.transact(() => {
    const metadata = ydoc.getMap("metadata");
    metadata.set("templateId", inv.templateId || "hjydg");
    metadata.set("schemaVersion", 1);
    metadata.set("updatedAt", Date.now());

    const globals = ydoc.getMap("globalSettings");
    globals.set("themeId", inv.themeId || "royal-blue-gold");
    globals.set("musicUrl", typeof overrides.musicUrl === "string" ? overrides.musicUrl : "/assets/audio/easy-on-me.webm");
    globals.set("musicVolume", typeof overrides.musicVolume === "number" ? overrides.musicVolume : 0.6);
    const colors = new Y.Map();
    if (overrides.customColors && typeof overrides.customColors === "object") {
      Object.entries(overrides.customColors).forEach(([key, value]) => { if (typeof value === "string") colors.set(key, value); });
    }
    globals.set("customColors", colors);

    const order = ydoc.getArray("sectionOrder");
    const sections = ydoc.getMap("sections");
    for (const sec of secRows) {
      order.push([sec.id]);
      const secMap = new Y.Map();
      secMap.set("id", sec.id);
      secMap.set("type", sec.type);
      secMap.set("enabled", Boolean(sec.enabled));
      let data = {};
      try { data = typeof sec.data === "string" ? JSON.parse(sec.data) : (sec.data || {}); } catch {}
      const dataMap = new Y.Map();
      const styles = new Y.Map();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "textStyles" && value && typeof value === "object" && !Array.isArray(value)) Object.entries(value).forEach(([styleKey, styleValue]) => styles.set(styleKey, styleValue));
        else dataMap.set(key, value);
      });
      secMap.set("data", dataMap);
      secMap.set("textStyles", styles);
      sections.set(sec.id, secMap);
    }
  });
  return 1;
}

async function getOrCreateRoom(draftId) {
  let room = rooms.get(draftId);
  if (!room) {
    const ydoc = new Y.Doc();
    room = { clients: new Set(), presences: new Map(), ydoc, revision: await loadRoomSnapshot(draftId, ydoc), isDirty: false, debounceTimer: null, forcedTimer: null };
    rooms.set(draftId, room);
  }
  return room;
}

function broadcastToRoom(draftId, message, excludedClient = null) {
  const room = rooms.get(draftId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room.clients) {
    if (client !== excludedClient && client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

async function flushRoomSnapshot(room, draftId, createdBy = null) {
  if (!room.isDirty) return true;
  if (room.debounceTimer) clearTimeout(room.debounceTimer);
  if (room.forcedTimer) clearTimeout(room.forcedTimer);
  room.debounceTimer = null;
  room.forcedTimer = null;

  const connection = await dbPool.getConnection();
  try {
    const sectionsMap = room.ydoc.getMap("sections");
    const orderedIds = room.ydoc.getArray("sectionOrder").toArray();
    const rows = orderedIds.flatMap((id, order) => {
      const section = sectionsMap.get(id);
      if (!(section instanceof Y.Map)) return [];
      const type = safeString(section.get("type"), 64);
      if (!type) return [];
      const data = jsonFromY(section.get("data"));
      const styles = jsonFromY(section.get("textStyles"));
      if (styles && typeof styles === "object" && Object.keys(styles).length) data.textStyles = styles;
      return [[id, draftId, type, order, section.get("enabled") ? 1 : 0, JSON.stringify(data)]];
    });
    const globals = room.ydoc.getMap("globalSettings");
    const themeId = safeString(globals.get("themeId"), 64) || "royal-blue-gold";
    await connection.beginTransaction();
    const [currentRows] = await connection.query("SELECT style_overrides AS styleOverrides FROM invitations WHERE id = ? FOR UPDATE", [draftId]);
    let styleOverrides = {};
    try { styleOverrides = typeof currentRows[0]?.styleOverrides === "string" ? JSON.parse(currentRows[0].styleOverrides || "{}") : (currentRows[0]?.styleOverrides || {}); } catch {}
    styleOverrides = {
      ...styleOverrides,
      musicUrl: typeof globals.get("musicUrl") === "string" ? globals.get("musicUrl") : "",
      musicVolume: Number(globals.get("musicVolume") ?? 0.6),
      customColors: jsonFromY(globals.get("customColors")) || {},
    };

    await connection.query("DELETE FROM invitation_sections WHERE invitation_id = ?", [draftId]);
    if (rows.length) await connection.query("INSERT INTO invitation_sections (id, invitation_id, type, section_order, enabled, data) VALUES ?", [rows]);
    const revision = room.revision++;
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(room.ydoc)).toString("base64");
    await connection.query(
      "INSERT INTO invitation_collaboration_snapshots (id, invitation_id, revision, schema_version, snapshot, created_by) VALUES (?, ?, ?, 1, ?, ?)",
      [randomUUID(), draftId, revision, snapshot, createdBy]
    );
    await connection.query("UPDATE invitations SET theme_id = ?, style_overrides = ?, updated_at = NOW() WHERE id = ?", [themeId, JSON.stringify(styleOverrides), draftId]);
    await connection.commit();
    room.isDirty = false;
    return true;
  } catch (error) {
    await connection.rollback().catch(() => {});
    console.error(`[Collab Server] gagal menyimpan snapshot ${draftId}:`, error.message);
    room.isDirty = true;
    setTimeout(() => { if (rooms.get(draftId) === room) void flushRoomSnapshot(room, draftId, createdBy); }, 3_000);
    return false;
  } finally {
    connection.release();
  }
}

function scheduleSnapshotFlush(room, draftId, userId) {
  room.isDirty = true;
  if (room.debounceTimer) clearTimeout(room.debounceTimer);
  room.debounceTimer = setTimeout(() => void flushRoomSnapshot(room, draftId, userId), 2_000);
  if (!room.forcedTimer) room.forcedTimer = setTimeout(() => void flushRoomSnapshot(room, draftId, userId), 10_000);
}

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const draftId = url.searchParams.get("draftId") || "";
  const configuredOrigin = process.env.COLLAB_ALLOWED_ORIGIN;
  const requestOrigin = req.headers.origin;
  const isLocalOrigin = Boolean(requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin));
  const originAllowed = process.env.NODE_ENV === "production"
    ? Boolean(configuredOrigin && requestOrigin === configuredOrigin)
    : Boolean(configuredOrigin ? requestOrigin === configuredOrigin : isLocalOrigin);
  if (!originAllowed || !DRAFT_ID_PATTERN.test(draftId)) {
    ws.close(1008, "Unauthorized");
    return;
  }

  let principal;
  try { principal = await resolvePrincipal(req.headers.cookie, draftId); } catch (error) { console.error("[Collab Server] auth error:", error.message); }
  if (!principal) {
    ws.close(1008, "Unauthorized");
    return;
  }

  const room = await getOrCreateRoom(draftId);
  const connectionId = randomUUID();
  let joined = false;
  room.clients.add(ws);
  ws.send(JSON.stringify({ type: "connection.ready", connectionId, role: principal.role }));
  ws.send(JSON.stringify({ type: "doc.init", update: Buffer.from(Y.encodeStateAsUpdate(room.ydoc)).toString("base64"), revision: room.revision }));
  ws.send(JSON.stringify({ type: "sync", presences: Array.from(room.presences.values()) }));

  const accessCheck = setInterval(async () => {
    const refreshed = await resolvePrincipal(req.headers.cookie, draftId).catch(() => null);
    if (!refreshed) ws.close(1008, "Access revoked");
    else {
      const roleChanged = refreshed.role !== principal.role;
      principal = refreshed;
      if (roleChanged) {
        ws.send(JSON.stringify({ type: "permission.update", role: principal.role }));
        const existing = room.presences.get(connectionId);
        if (existing) {
          const nextPresence = createPresence(principal, connectionId, existing);
          room.presences.set(connectionId, nextPresence);
          broadcastToRoom(draftId, { type: "update", presence: nextPresence }, ws);
        }
      }
    }
  }, 10_000);

  ws.on("message", async (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (!message || typeof message.type !== "string") return;

    // Always re-check write permission from MySQL; role, user id and draft id from
    // browser payload are never trusted.
    if (message.type === "doc.update" || message.type === "presence.update" || message.type === "cursor") {
      const refreshed = await resolvePrincipal(req.headers.cookie, draftId).catch(() => null);
      if (!refreshed) { ws.close(1008, "Access revoked"); return; }
      principal = refreshed;
    }

    if (message.type === "join" || message.type === "presence.update") {
      const presence = createPresence(principal, connectionId, message.presence || {});
      const wasJoined = joined;
      joined = true;
      room.presences.set(connectionId, presence);
      broadcastToRoom(draftId, { type: wasJoined ? "update" : "join", presence }, ws);
      return;
    }

    if (message.type === "cursor" && joined) {
      const cursor = message.cursor || {};
      broadcastToRoom(draftId, {
        type: "cursor",
        connectionId,
        userId: principal.id,
        cursor: {
          name: principal.name,
          color: colorForUser(principal.id),
          surface: safeSurface(cursor.surface),
          x: safeCoordinate(cursor.x),
          y: safeCoordinate(cursor.y),
          sectionId: safeString(cursor.sectionId, 80),
          fieldPath: safeString(cursor.fieldPath, 180),
        },
        updatedAt: Date.now(),
      }, ws);
      return;
    }

    if (message.type === "doc.update" && joined) {
      if (principal.role === "viewer" || typeof message.update !== "string" || Buffer.byteLength(message.update, "base64") > MAX_DOCUMENT_UPDATE_BYTES) return;
      try {
        Y.applyUpdate(room.ydoc, Buffer.from(message.update, "base64"));
        scheduleSnapshotFlush(room, draftId, principal.id);
        broadcastToRoom(draftId, { type: "doc.update", update: message.update, originConnectionId: connectionId }, ws);
      } catch {
        ws.close(1008, "Invalid document update");
      }
    }
  });

  ws.on("close", async () => {
    clearInterval(accessCheck);
    room.clients.delete(ws);
    const presence = room.presences.get(connectionId);
    room.presences.delete(connectionId);
    if (joined && presence) broadcastToRoom(draftId, { type: "leave", connectionId, userId: principal.id });
    if (room.clients.size === 0 && await flushRoomSnapshot(room, draftId, principal.id)) rooms.delete(draftId);
  });
  ws.on("error", () => ws.terminate());
});

const pingInterval = setInterval(() => wss.clients.forEach((ws) => ws.ping()), 20_000);
wss.on("close", () => clearInterval(pingInterval));
server.listen(PORT, () => console.log(`[Collab Server] ws://localhost:${PORT}`));
