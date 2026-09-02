const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function migrate() {
  const conn = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/undangan_console"
  );

  console.log("Migrating Phase 4: creating invitation_collaboration_snapshots table...");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS invitation_collaboration_snapshots (
      id VARCHAR(36) PRIMARY KEY,
      invitation_id VARCHAR(36) NOT NULL,
      revision BIGINT NOT NULL DEFAULT 1,
      schema_version INT NOT NULL DEFAULT 1,
      snapshot LONGTEXT NOT NULL,
      created_by VARCHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX snap_invitation_idx (invitation_id),
      INDEX snap_revision_idx (invitation_id, revision)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Phase 4 migration successful!");
  await conn.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
