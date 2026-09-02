const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const url = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/undangan_console";
  try {
    const conn = await mysql.createConnection(url);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(120) NOT NULL,
        avatar_url VARCHAR(1024),
        google_id VARCHAR(128),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY users_email_unique (email),
        UNIQUE KEY users_google_id_unique (google_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await conn.query(`ALTER TABLE invitations ADD COLUMN user_id CHAR(36)`);
    } catch (e) {
      // Column might already exist
    }

    console.log("Database schema for users and sessions is ready!");
    await conn.end();
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

run();
