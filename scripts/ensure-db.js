const mysql = require("mysql2/promise");

function getDatabaseConfig() {
  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = Number.parseInt(process.env.MYSQL_PORT || "3306", 10);
  const database = process.env.MYSQL_DATABASE || "undangan_console";
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD ?? "";

  return { host, port, database, user, password };
}

async function run() {
  const { host, port, database, user, password } = getDatabaseConfig();

  console.log(`[db:ensure] Checking/creating database "${database}" on ${host}:${port} as ${user}...`);

  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`[db:ensure] Database "${database}" is ready.`);
    await conn.end();
  } catch (err) {
    console.error(`[db:ensure] Error connecting/creating database "${database}":`, err.message);
    process.exit(1);
  }
}

run();
