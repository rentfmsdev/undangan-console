import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Salin .env.example ke .env.local.");
}

const globalForDb = globalThis as unknown as {
  mysqlPoolV2?: mysql.Pool;
};

const pool = globalForDb.mysqlPoolV2 ?? mysql.createPool(connectionString);

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPoolV2 = pool;

export const db = drizzle(pool, { schema, mode: "default" });
