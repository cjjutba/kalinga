import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { getTableColumns, getTableName } from "drizzle-orm";
import * as schema from "./schema";

// Fails the build if any tenant table or any query escapes scoping. This is
// the one bug class that would end the project, so the check is blunt on
// purpose: structure first, then a static read of every file that can reach
// the database.

const root = join(__dirname, "..", "..", "..");
const src = join(root, "src");

const authTables = new Set(["user", "session", "account", "verification", "organization", "member", "invitation"]);
const unscopedByDesign = new Set(["rate_limit"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.ts$/.test(entry)) out.push(full);
  }
  return out;
}

const tenantTableNames = Object.values(schema.tenantTables).map((t) => getTableName(t));
const tenantExportNames = Object.keys(schema.tenantTables);

describe("every tenant table is scoped by structure", () => {
  it("lists every non auth table in tenantTables", () => {
    const all = Object.entries(schema)
      .filter(([, v]) => v && typeof v === "object" && Symbol.for("drizzle:Name") in (v as object))
      .map(([, v]) => getTableName(v as never))
      .filter((n) => !authTables.has(n) && !unscopedByDesign.has(n));
    expect(new Set(all)).toEqual(new Set(tenantTableNames));
  });

  it("gives every tenant table a non null organisation_id", () => {
    for (const table of Object.values(schema.tenantTables)) {
      const cols = getTableColumns(table);
      const col = cols.organisationId;
      expect(col, `${getTableName(table)} lacks organisationId`).toBeDefined();
      expect(col.notNull, `${getTableName(table)}.organisation_id must be NOT NULL`).toBe(true);
    }
  });
});

describe("every query goes through a scope", () => {
  const files = walk(src);
  const allowedClientImporters = ["src/lib/db/", "src/lib/auth.ts", "src/lib/session.ts"];

  // Raw drizzle builders reach the database directly. A Scope's methods take
  // the same table argument but add the organisation clause themselves, so
  // the checks below look only at raw executors: db, a transaction handle, or
  // the .raw escape hatch on a Scope.
  const rawBuilder = /\b(db|tx|ex|raw)\.(select|from|update|delete|insert)\(/;

  it("only the database layer, auth and session import the raw client", () => {
    const offenders = files.filter((f) => {
      const rel = relative(root, f);
      if (allowedClientImporters.some((a) => rel.startsWith(a))) return false;
      const text = readFileSync(f, "utf8");
      return /from ["'](@\/lib\/db\/client|\.\.?\/client|\.\/db\/client)["']/.test(text);
    });
    expect(offenders.map((f) => relative(root, f))).toEqual([]);
  });

  it("never uses a raw builder or the .raw escape hatch outside src/lib/db", () => {
    const offenders = files.filter((f) => {
      const rel = relative(root, f);
      if (allowedClientImporters.some((a) => rel.startsWith(a))) return false;
      const text = readFileSync(f, "utf8");
      return /\.raw\b/.test(text) || rawBuilder.test(text);
    });
    expect(offenders.map((f) => relative(root, f))).toEqual([]);
  });

  it("carries organisation_id on every raw tenant statement inside the database layer", () => {
    const queryFiles = files.filter((f) => {
      const rel = relative(root, f);
      return (rel.startsWith("src/lib/db/") || rel === "src/lib/session.ts") && !/schema\.ts$|auth-schema\.ts$|client\.ts$|types\.ts$/.test(f);
    });
    const problems: string[] = [];
    for (const f of queryFiles) {
      const text = readFileSync(f, "utf8");
      // A statement is a chained builder expression ending at a semicolon.
      for (const s of text.split(/;\s*\n/)) {
        if (!rawBuilder.test(s)) continue;
        const touches = tenantExportNames.filter((n) => new RegExp(`\\.(from|update|delete|insert)\\(\\s*(${n}|table as PgTable|table)\\b`).test(s));
        if (!touches.length) continue;
        const scopedOk = /scope\.where\(|this\.where\(|organisationId|identity lookup/.test(s);
        if (!scopedOk) problems.push(`${relative(root, f)}: statement touching ${touches.join(", ")} has no organisation_id`);
      }
    }
    expect(problems).toEqual([]);
  });
});
