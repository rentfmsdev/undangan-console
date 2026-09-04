const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function run() {
  const url = getDatabaseUrl();
  try {
    const conn = await mysql.createConnection(url);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS invitation_collaborators (
        id CHAR(36) PRIMARY KEY,
        invitation_id CHAR(36) NOT NULL,
        user_id CHAR(36),
        email VARCHAR(255) NOT NULL,
        role ENUM('editor', 'viewer') NOT NULL DEFAULT 'editor',
        invite_token VARCHAR(64) NOT NULL,
        status ENUM('pending', 'accepted') NOT NULL DEFAULT 'pending',
        invited_by CHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY invitation_collaborators_unique (invitation_id, email),
        KEY invitation_collaborators_user_id_idx (user_id),
        KEY invitation_collaborators_email_idx (email),
        KEY invitation_collaborators_token_idx (invite_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Database schema for invitation_collaborators is ready!");
    await conn.end();
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  }
}

run();
