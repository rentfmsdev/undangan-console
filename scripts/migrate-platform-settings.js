const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function run() {
  const connection = await mysql.createConnection(getDatabaseUrl());
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        \`key\` VARCHAR(128) NOT NULL PRIMARY KEY,
        \`value\` JSON NOT NULL,
        updated_by CHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX platform_settings_updated_at_idx (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("[migrate-platform-settings] Platform settings table is ready.");
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("[migrate-platform-settings] Migration failed:", error.message);
  process.exit(1);
});
