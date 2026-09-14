import mysql from "mysql2/promise";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });
dotenv.config({ path: resolve(__dirname, "../.env") });

function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return { uri: process.env.DATABASE_URL };
  }
  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = Number.parseInt(process.env.MYSQL_PORT || "3306", 10);
  const database = process.env.MYSQL_DATABASE || "undangan_console";
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD ?? "";

  return { host, port, database, user, password };
}

function hashPassword(password, salt) {
  return new Promise((res, rej) => {
    crypto.scrypt(password.normalize("NFKC"), salt, 64, (err, key) => {
      if (err) return rej(err);
      res(key.toString("hex"));
    });
  });
}

async function main() {
  const username = (process.env.ROOTS_BOOTSTRAP_USERNAME || "undanganku").trim().toLowerCase();
  const password = process.env.ROOTS_BOOTSTRAP_PASSWORD || "Password1323";
  const forceReset = process.env.ROOTS_BOOTSTRAP_RESET_PASSWORD === "true" || process.env.ROOTS_FORCE_RESET === "true";

  if (!password || password.trim().length < 8) {
    console.error("[bootstrap-roots-admin] Error: ROOTS_BOOTSTRAP_PASSWORD must be at least 8 characters long when provided.");
    process.exit(1);
  }

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    console.error("[bootstrap-roots-admin] Error: ROOTS_BOOTSTRAP_USERNAME must be 3-30 alphanumeric characters (or _ / -).");
    process.exit(1);
  }

  const dbConfig = getDatabaseConfig();
  const conn = await mysql.createConnection(dbConfig.uri || dbConfig);

  try {
    const internalEmail = `${username}@roots.internal.invalid`;
    // 1. Check existing user by email
    const [existingUsers] = await conn.query(
      "SELECT id, role FROM users WHERE email = ? LIMIT 1",
      [internalEmail]
    );

    let userId;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      // Ensure role is admin
      await conn.query("UPDATE users SET role = 'admin', name = 'Roots Super Admin' WHERE id = ?", [userId]);
    } else {
      userId = crypto.randomUUID();
      await conn.query(
        "INSERT INTO users (id, email, name, role) VALUES (?, ?, 'Roots Super Admin', 'admin')",
        [userId, internalEmail]
      );
    }

    // 2. Check existing credential by username or userId
    const [existingCreds] = await conn.query(
      "SELECT id, must_change_password FROM root_admin_credentials WHERE username = ? OR user_id = ? LIMIT 1",
      [username, userId]
    );

    if (existingCreds.length > 0) {
      const credId = existingCreds[0].id;
      if (!forceReset) {
        console.log(`[bootstrap-roots-admin] Admin account '${username}' already exists; seed skipped.`);
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(password, salt);

      await conn.query(
        `UPDATE root_admin_credentials 
         SET password_hash = ?, password_salt = ?, must_change_password = 1, failed_attempts = 0, locked_until = NULL, updated_at = NOW() 
         WHERE id = ?`,
        [passwordHash, salt, credId]
      );
      console.log(`[bootstrap-roots-admin] Admin account '${username}' password reset from environment.`);
    } else {
      const credId = crypto.randomUUID();
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(password, salt);
      await conn.query(
        `INSERT INTO root_admin_credentials 
         (id, user_id, username, password_hash, password_salt, must_change_password, failed_attempts, created_by) 
         VALUES (?, ?, ?, ?, ?, 1, 0, NULL)`,
        [credId, userId, username, passwordHash, salt]
      );
      console.log(`[bootstrap-roots-admin] Admin account '${username}' created with initial bootstrap credentials.`);
    }

    // 3. Log audit event
    const auditId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO root_admin_audit_logs 
       (id, actor_user_id, action, target_user_id, details) 
       VALUES (?, ?, 'bootstrap_admin', ?, ?)`,
      [auditId, userId, userId, JSON.stringify({ username, source: "bootstrap_script", forceReset })]
    );

    console.log(`[bootstrap-roots-admin] Admin account '${username}' successfully configured.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[bootstrap-roots-admin] Execution failed:", err.message);
  process.exit(1);
});
