export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = process.env.MYSQL_PORT || "3306";
  const database = process.env.MYSQL_DATABASE || "undangan_console";
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD ?? "";

  const auth = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
  return `mysql://${auth}@${host}:${port}/${database}`;
}
