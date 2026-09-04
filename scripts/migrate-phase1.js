const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function run() {
  const url = getDatabaseUrl();
  try {
    const conn = await mysql.createConnection(url);
    console.log("Connected to MySQL. Migrating Phase 1 schema...");

    // Update invitation_collaborators table
    await conn.query(`
      ALTER TABLE invitation_collaborators
        MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
        MODIFY COLUMN invite_token VARCHAR(64) NULL,
        ADD COLUMN IF NOT EXISTS invite_token_hash VARCHAR(64) NULL AFTER role,
        ADD COLUMN IF NOT EXISTS expires_at DATETIME NULL AFTER invited_by,
        ADD COLUMN IF NOT EXISTS accepted_at DATETIME NULL AFTER expires_at,
        ADD COLUMN IF NOT EXISTS declined_at DATETIME NULL AFTER accepted_at,
        ADD COLUMN IF NOT EXISTS revoked_at DATETIME NULL AFTER declined_at,
        ADD COLUMN IF NOT EXISTS last_seen_at DATETIME NULL AFTER revoked_at;
    `);

    // Backfill token hash if old invite_token column exists
    try {
      await conn.query(`
        UPDATE invitation_collaborators
        SET invite_token_hash = SHA2(invite_token, 256)
        WHERE invite_token_hash IS NULL AND invite_token IS NOT NULL;
      `);
    } catch {
      // Ignored if invite_token column not present
    }

    // Ensure index on status and token_hash
    try {
      await conn.query(`ALTER TABLE invitation_collaborators ADD INDEX invitation_collaborators_status_idx (status);`);
    } catch {}
    try {
      await conn.query(`ALTER TABLE invitation_collaborators ADD INDEX invitation_collaborators_token_hash_idx (invite_token_hash);`);
    } catch {}

    // Create invitation_activity_logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS invitation_activity_logs (
        id CHAR(36) PRIMARY KEY,
        invitation_id CHAR(36) NOT NULL,
        user_id CHAR(36) NULL,
        action VARCHAR(64) NOT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY invitation_activity_logs_invitation_id_idx (invitation_id),
        KEY invitation_activity_logs_action_idx (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create email_outbox table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS email_outbox (
        id CHAR(36) PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        payload JSON NOT NULL,
        status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
        attempts INT NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        sent_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY email_outbox_status_idx (status),
        KEY email_outbox_recipient_idx (recipient)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Phase 1 MySQL migration completed successfully!");
    await conn.end();
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

run();
