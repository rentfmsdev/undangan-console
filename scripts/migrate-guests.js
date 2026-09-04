const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function run() {
  const url = getDatabaseUrl();
  try {
    const conn = await mysql.createConnection(url);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS invitation_guests (
        id CHAR(36) PRIMARY KEY,
        invitation_id CHAR(36) NOT NULL,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(140) NOT NULL,
        phone VARCHAR(30),
        \`group\` VARCHAR(60) NOT NULL DEFAULT 'Umum',
        status ENUM('pending', 'sent') NOT NULL DEFAULT 'pending',
        sent_at DATETIME,
        opened_at DATETIME,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY invitation_guests_invitation_id_idx (invitation_id),
        KEY invitation_guests_invitation_slug_idx (invitation_id, slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Database schema for invitation_guests is ready!");
    await conn.end();
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

run();
