const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

async function run() {
  const url = getDatabaseUrl();
  console.log("[migrate-payments] Connecting to database...");

  try {
    const conn = await mysql.createConnection(url);

    console.log("[migrate-payments] Ensuring users.phone column...");
    try {
      await conn.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL DEFAULT NULL");
      await conn.query("ALTER TABLE users MODIFY COLUMN phone VARCHAR(30) NULL DEFAULT NULL");
    } catch (err) {
      console.warn("[migrate-payments] Note on users.phone:", err.message);
    }

    console.log("[migrate-payments] Creating payments table if not exists...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id CHAR(36) NOT NULL PRIMARY KEY,
        invitation_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        reference_id VARCHAR(128) NULL,
        amount INT NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
        mode ENUM('path', 'subdomain', 'custom_domain') NOT NULL DEFAULT 'path',
        identifier VARCHAR(255) NOT NULL,
        payment_method VARCHAR(32) NOT NULL DEFAULT 'QR',
        payment_channel VARCHAR(32) NOT NULL DEFAULT 'QRIS',
        status ENUM('pending', 'paid', 'expired', 'failed') NOT NULL DEFAULT 'pending',
        customer_name VARCHAR(120) NULL,
        customer_email VARCHAR(255) NULL,
        customer_phone VARCHAR(30) NULL,
        raw_response JSON NULL,
        paid_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX payments_invitation_id_idx (invitation_id),
        INDEX payments_user_id_idx (user_id),
        INDEX payments_reference_id_idx (reference_id),
        INDEX payments_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[migrate-payments] ✅ Payments migration completed successfully!");
    await conn.end();
  } catch (err) {
    console.error("[migrate-payments] ❌ Migration failed:", err.message);
    process.exit(1);
  }
}

run();
