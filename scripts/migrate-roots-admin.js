const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function run() {
  const url = getDatabaseUrl();
  console.log("[migrate-roots-admin] Connecting to database...");

  try {
    const conn = await mysql.createConnection(url);

    console.log("[migrate-roots-admin] Creating root_admin_credentials table if not exists...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS root_admin_credentials (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        username VARCHAR(64) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(64) NOT NULL,
        must_change_password INT NOT NULL DEFAULT 1,
        failed_attempts INT NOT NULL DEFAULT 0,
        locked_until DATETIME NULL,
        last_login_at DATETIME NULL,
        created_by CHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY root_admin_credentials_username_unique (username),
        UNIQUE KEY root_admin_credentials_user_id_unique (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[migrate-roots-admin] Creating root_admin_audit_logs table if not exists...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS root_admin_audit_logs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        actor_user_id CHAR(36) NULL,
        action VARCHAR(64) NOT NULL,
        target_user_id CHAR(36) NULL,
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(512) NULL,
        details JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX root_admin_audit_logs_actor_idx (actor_user_id),
        INDEX root_admin_audit_logs_action_idx (action),
        INDEX root_admin_audit_logs_created_at_idx (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[migrate-roots-admin] ✅ Roots Admin migration completed successfully!");
    await conn.end();
  } catch (err) {
    console.error("[migrate-roots-admin] ❌ Migration failed:", err.message);
    process.exit(1);
  }
}

run();
