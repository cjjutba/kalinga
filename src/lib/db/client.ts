import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// One pool per process over Neon's pooled endpoint. On Vercel the pool is
// attached to the function lifecycle so idle connections close before the
// instance is suspended. Nothing outside src/lib/db imports this directly;
// tenant reads and writes go through scoped.ts.

declare global {
  var __kalingaPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  attachDatabasePool(pool);
  return pool;
}

export const pool: Pool = globalThis.__kalingaPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__kalingaPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
