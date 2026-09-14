const mysql = require("mysql2/promise");
const { getDatabaseUrl } = require("./db-config");

async function run() {
  const url = getDatabaseUrl();
  const conn = await mysql.createConnection(url);
  const adminEmails = [
    "ardiandra45@gmail.com",
    "ardiandra53@gmail.com",
    "santaiscale@gmail.com",
  ];
  await conn.query("UPDATE users SET role = 'admin' WHERE email IN (?, ?, ?)", adminEmails);
  const [rows] = await conn.query("SELECT id, email, name, role FROM users WHERE email IN (?, ?, ?)", adminEmails);
  console.log("Admin users updated successfully:", rows);
  await conn.end();
}

run().catch(console.error);
