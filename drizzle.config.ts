import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migrations always run over the direct connection. The pooled string is for
// the application only, because PgBouncer in transaction mode cannot hold the
// session state a migration needs.

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set. Copy .env.example to .env.local.");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
