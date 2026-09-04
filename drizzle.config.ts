import "dotenv/config";
import { defineConfig } from "drizzle-kit";

function getDbCredentials() {
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL };
  }
  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = Number.parseInt(process.env.MYSQL_PORT || "3306", 10);
  const database = process.env.MYSQL_DATABASE || "undangan_console";
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD ?? "";

  if (!password) {
    return {
      url: `mysql://${encodeURIComponent(user)}@${host}:${port}/${database}`,
    };
  }

  return {
    host,
    port,
    user,
    password,
    database,
  };
}

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: getDbCredentials(),
});
