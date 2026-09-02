import WebSocket from "ws";
import * as Y from "yjs";
import mysql from "mysql2/promise";

const WS_BASE = "ws://localhost:3001";
const DRAFT_ID = "00000000-0000-4000-a000-000000000045";
const USER_45 = "acc6d7ce-c2eb-4c1c-ae6b-11e63d0cdcfa";
const USER_53 = "fdda1b06-10a5-4a85-8f7e-b90226ec1175";
const SESSION_A = "sess-user-45-audit-tok";
const SESSION_B = "sess-user-53-audit-tok";

const db = await mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "undangan_console",
});

console.log("=== STEP 0: Setting up MySQL fixtures for full field audit ===");

// 1. Sessions with real user IDs
await db.query(`DELETE FROM sessions WHERE id IN (?, ?)`, [SESSION_A, SESSION_B]);
await db.query(
  `INSERT INTO sessions (id, user_id, expires_at, created_at)
   VALUES 
   (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW()),
   (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW())`,
  [SESSION_A, USER_45, SESSION_B, USER_53]
);

// 2. Draft fixtures
await db.query(`DELETE FROM invitation_collaboration_snapshots WHERE invitation_id = ?`, [DRAFT_ID]);
await db.query(`DELETE FROM invitation_collaborators WHERE invitation_id = ? OR id = 'collab-45'`, [DRAFT_ID]);
await db.query(`DELETE FROM invitation_sections WHERE invitation_id = ? OR id IN ('sec-cover', 'sec-mempelai', 'sec-galeri')`, [DRAFT_ID]);
await db.query(`DELETE FROM invitations WHERE id = ?`, [DRAFT_ID]);

await db.query(
  `INSERT INTO invitations (id, user_id, template_id, template_version, theme_id, style_overrides, edit_token_hash, created_at, updated_at)
   VALUES (?, ?, 'hjydg', 1, 'royal-blue-gold', '{}', 'mock-hash-12345', NOW(), NOW())`,
  [DRAFT_ID, USER_53]
);

// 3. Collaborator membership for user-45 (ardiandra45 is editor, user-53 is owner)
await db.query(
  `INSERT INTO invitation_collaborators (id, invitation_id, email, user_id, role, status, invited_by, created_at, updated_at)
   VALUES 
   ('collab-45', ?, 'ardiandra45@gmail.com', ?, 'editor', 'accepted', ?, NOW(), NOW())`,
  [DRAFT_ID, USER_45, USER_53]
);

// 4. Initial sections
await db.query(
  `INSERT INTO invitation_sections (id, invitation_id, type, section_order, enabled, data)
   VALUES 
   ('sec-cover', ?, 'cover', 0, 1, JSON_OBJECT('title', 'The Wedding of Romeo & Juliet', 'date', '2026-10-10')),
   ('sec-mempelai', ?, 'mempelai', 1, 1, JSON_OBJECT('groomName', 'Romeo Montague', 'brideName', 'Juliet Capulet'))`,
  [DRAFT_ID, DRAFT_ID]
);

console.log("=== STEP 1: Connecting Client A (ardiandra45) and Client B (ardiandra53) via WebSocket ===");

function connectClient(name, sessionToken) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}?draftId=${DRAFT_ID}`, {
      headers: {
        origin: "http://localhost:3000",
        cookie: `undangan_session=${sessionToken}`,
      },
    });
    const ydoc = new Y.Doc();

    const client = {
      name,
      ws,
      ydoc,
      ready: false,
    };

    ws.on("open", () => {
      // console.log(`[${name}] WebSocket OPEN`);
    });

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "connection.ready") {
        ws.send(JSON.stringify({ type: "join", presence: { surface: "workspace" } }));
      } else if (msg.type === "doc.init") {
        const update = Buffer.from(msg.update, "base64");
        Y.applyUpdate(ydoc, update);
        client.ready = true;
        resolve(client);
      } else if (msg.type === "doc.update") {
        const update = Buffer.from(msg.update, "base64");
        Y.applyUpdate(ydoc, update);
      }
    });

    ws.on("error", reject);
    ws.on("close", (code, reason) => {
      if (!client.ready) reject(new Error(`WebSocket closed before ready: ${code} ${reason.toString()}`));
    });
  });
}

const clientA = await connectClient("ardiandra45", SESSION_A);
const clientB = await connectClient("ardiandra53", SESSION_B);

console.log("Both clients connected and synchronized doc.init!");

function applyAndSendUpdate(client, mutateFn) {
  let updateBinary;
  client.ydoc.once("update", (u) => {
    updateBinary = u;
  });
  client.ydoc.transact(() => {
    mutateFn(client.ydoc);
  });
  if (updateBinary) {
    client.ws.send(JSON.stringify({
      type: "doc.update",
      update: Buffer.from(updateBinary).toString("base64"),
    }));
  }
}

async function waitFor(fn, timeoutMs = 4000, desc = "condition") {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timeout waiting for: ${desc}`);
}

console.log("\n=== TEST 1: Volume sync (50%) from ardiandra45 to ardiandra53 ===");
applyAndSendUpdate(clientA, (doc) => {
  doc.getMap("globalSettings").set("musicVolume", 0.5);
});
await waitFor(() => clientB.ydoc.getMap("globalSettings").get("musicVolume") === 0.5, 3000, "Client B musicVolume === 0.5");
console.log("PASS: Client B (owner) received musicVolume = 0.50 from Client A (collaborator)");

console.log("\n=== TEST 2: Music URL sync ('Tanpa musik' = '') from ardiandra45 to ardiandra53 ===");
applyAndSendUpdate(clientA, (doc) => {
  doc.getMap("globalSettings").set("musicUrl", "");
});
await waitFor(() => clientB.ydoc.getMap("globalSettings").get("musicUrl") === "", 3000, "Client B musicUrl === ''");
console.log("PASS: Client B (owner) received musicUrl = '' (Tanpa musik)");

console.log("\n=== TEST 3: Theme ID & Custom Colors sync from ardiandra45 to ardiandra53 ===");
applyAndSendUpdate(clientA, (doc) => {
  const globals = doc.getMap("globalSettings");
  globals.set("themeId", "emerald-luxury");
  let colors = globals.get("customColors");
  if (!(colors instanceof Y.Map)) {
    colors = new Y.Map();
    globals.set("customColors", colors);
  }
  colors.set("primary", "#047857");
  colors.set("accent", "#d97706");
  colors.set("background", "#064e3b");
});
await waitFor(() => {
  const globals = clientB.ydoc.getMap("globalSettings");
  const colors = globals.get("customColors");
  return (
    globals.get("themeId") === "emerald-luxury" &&
    colors instanceof Y.Map &&
    colors.get("primary") === "#047857" &&
    colors.get("accent") === "#d97706" &&
    colors.get("background") === "#064e3b"
  );
}, 3000, "Client B themeId and customColors");
console.log("PASS: Client B received themeId = 'emerald-luxury' and customColors");

console.log("\n=== TEST 4: Section Text & Textarea field sync from ardiandra53 to ardiandra45 ===");
applyAndSendUpdate(clientB, (doc) => {
  const secCover = doc.getMap("sections").get("sec-cover");
  const data = secCover.get("data");
  data.set("title", "Pernikahan Megah Romeo & Juliet");
});
await waitFor(() => {
  const secCover = clientA.ydoc.getMap("sections").get("sec-cover");
  return secCover?.get("data")?.get("title") === "Pernikahan Megah Romeo & Juliet";
}, 3000, "Client A text field update");
console.log("PASS: Client A received text field mutation 'Pernikahan Megah Romeo & Juliet'");

console.log("\n=== TEST 5: Typography TextStyle sync from ardiandra45 to ardiandra53 ===");
applyAndSendUpdate(clientA, (doc) => {
  const secCover = doc.getMap("sections").get("sec-cover");
  let styles = secCover.get("textStyles");
  if (!(styles instanceof Y.Map)) {
    styles = new Y.Map();
    secCover.set("textStyles", styles);
  }
  styles.set("title", {
    fontFamily: "Playfair Display",
    fontSize: 32,
    color: "#d97706",
    bold: true,
    italic: true,
  });
});
await waitFor(() => {
  const secCover = clientB.ydoc.getMap("sections").get("sec-cover");
  const titleStyle = secCover?.get("textStyles")?.get("title");
  return (
    titleStyle?.fontFamily === "Playfair Display" &&
    titleStyle?.fontSize === 32 &&
    titleStyle?.bold === true
  );
}, 3000, "Client B textStyle sync");
console.log("PASS: Client B received Typography TextStyle changes");

console.log("\n=== TEST 6: Component Photos (single & gallery) & Background sync ===");
applyAndSendUpdate(clientA, (doc) => {
  const secMempelai = doc.getMap("sections").get("sec-mempelai");
  const data = secMempelai.get("data");
  data.set("imageUrl", "https://storage.googleapis.com/assets/romeo.webp");
  data.set("imageLabel", "Foto Romeo");
  data.set("backgroundColor", "#f8fafc");
  data.set("backgroundImageUrl", "https://storage.googleapis.com/assets/bg-floral.webp");
});
await waitFor(() => {
  const secMempelai = clientB.ydoc.getMap("sections").get("sec-mempelai");
  const data = secMempelai?.get("data");
  return (
    data?.get("imageUrl") === "https://storage.googleapis.com/assets/romeo.webp" &&
    data?.get("backgroundColor") === "#f8fafc" &&
    data?.get("backgroundImageUrl") === "https://storage.googleapis.com/assets/bg-floral.webp"
  );
}, 3000, "Client B image and background sync");
console.log("PASS: Client B received single photo and background mutations");

console.log("\n=== TEST 7: Add new section & SectionOrder reorder sync ===");
applyAndSendUpdate(clientA, (doc) => {
  const sections = doc.getMap("sections");
  const newSec = new Y.Map();
  newSec.set("id", "sec-galeri");
  newSec.set("type", "gallery");
  newSec.set("enabled", true);
  const data = new Y.Map();
  data.set("imageUrls", ["https://storage.googleapis.com/assets/g1.webp", "https://storage.googleapis.com/assets/g2.webp"]);
  newSec.set("data", data);
  sections.set("sec-galeri", newSec);

  const order = doc.getArray("sectionOrder");
  order.push(["sec-galeri"]);
});
await waitFor(() => {
  const secGaleri = clientB.ydoc.getMap("sections").get("sec-galeri");
  const order = clientB.ydoc.getArray("sectionOrder").toArray();
  return secGaleri && order.includes("sec-galeri");
}, 3000, "Client B add section and order sync");
console.log("PASS: Client B received new gallery section and updated sectionOrder");

console.log("\n=== TEST 8: Section toggle enabled / disabled sync ===");
applyAndSendUpdate(clientB, (doc) => {
  const secCover = doc.getMap("sections").get("sec-cover");
  secCover.set("enabled", false);
});
await waitFor(() => {
  const secCover = clientA.ydoc.getMap("sections").get("sec-cover");
  return secCover?.get("enabled") === false;
}, 3000, "Client A section toggle sync");
console.log("PASS: Client A received section toggle enabled = false");

console.log("\n=== TEST 9: Waiting for server debounced snapshot flush to MySQL ===");
await new Promise((r) => setTimeout(r, 2600));

const [invRows] = await db.query("SELECT theme_id, style_overrides FROM invitations WHERE id = ?", [DRAFT_ID]);
const styleOverrides = typeof invRows[0].style_overrides === "string" ? JSON.parse(invRows[0].style_overrides) : invRows[0].style_overrides;

console.log("Database verification:");
console.log("- theme_id:", invRows[0].theme_id);
console.log("- musicVolume:", styleOverrides.musicVolume);
console.log("- musicUrl:", styleOverrides.musicUrl);
console.log("- customColors:", styleOverrides.customColors);

if (invRows[0].theme_id !== "emerald-luxury") throw new Error("Theme ID was not persisted to MySQL!");
if (styleOverrides.musicVolume !== 0.5) throw new Error("musicVolume 0.5 was not persisted to MySQL!");
if (styleOverrides.musicUrl !== "") throw new Error("musicUrl '' was not persisted to MySQL!");
if (styleOverrides.customColors.primary !== "#047857") throw new Error("customColors was not persisted to MySQL!");

const [secDbRows] = await db.query("SELECT id, type, enabled, data FROM invitation_sections WHERE invitation_id = ? ORDER BY section_order ASC", [DRAFT_ID]);
console.log(`- Persisted ${secDbRows.length} sections to MySQL:`, secDbRows.map(s => `${s.id} (enabled=${s.enabled})`).join(", "));

const coverDb = secDbRows.find(s => s.id === "sec-cover");
if (!coverDb || coverDb.enabled !== 0) throw new Error("sec-cover enabled=0 was not persisted to MySQL!");

const dataCover = typeof coverDb.data === "string" ? JSON.parse(coverDb.data) : coverDb.data;
if (dataCover.title !== "Pernikahan Megah Romeo & Juliet") throw new Error("Title was not persisted!");
if (dataCover.textStyles?.title?.fontFamily !== "Playfair Display") throw new Error("TextStyle was not persisted!");

console.log("\n🎉 ALL 9 TEST SUITES PASSED WITH 100% SUCCESS!");

clientA.ws.close();
clientB.ws.close();
await db.end();
process.exit(0);
