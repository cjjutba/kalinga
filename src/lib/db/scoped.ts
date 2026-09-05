import "server-only";
import { and, eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db, type Db } from "./client";
import { tenantTables } from "./schema";

// The only door to tenant data. Nothing outside src/lib/db reads or writes a
// tenant table except through a Scope, and a Scope cannot exist without an
// organisation id. The scoping test in scoping.test.ts fails the build if a
// query slips around it.

type TenantTable = (typeof tenantTables)[keyof typeof tenantTables];
type WithOrg = PgTable & { organisationId: TenantTable["organisationId"]; id: TenantTable["id"] };

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

export class Scope {
  constructor(
    public readonly orgId: string,
    private readonly ex: Executor = db,
  ) {
    if (!orgId) throw new Error("A scope needs an organisation id");
  }

  /** The where clause every tenant query carries. Extra conditions are ANDed in. */
  where<T extends WithOrg>(table: T, ...extra: (SQL | undefined)[]): SQL {
    return and(eq(table.organisationId, this.orgId), ...extra.filter(Boolean))!;
  }

  list<T extends WithOrg>(table: T, ...extra: (SQL | undefined)[]) {
    return this.ex.select().from(table as PgTable).where(this.where(table, ...extra)) as unknown as Promise<T["$inferSelect"][]>;
  }

  async one<T extends WithOrg>(table: T, ...extra: (SQL | undefined)[]): Promise<T["$inferSelect"] | undefined> {
    const rows = (await this.ex.select().from(table as PgTable).where(this.where(table, ...extra)).limit(1)) as T["$inferSelect"][];
    return rows[0];
  }

  byId<T extends WithOrg>(table: T, id: string) {
    return this.one(table, eq(table.id, id));
  }

  /** Inserts always carry this scope's organisation id, whatever the caller passed. */
  async insert<T extends WithOrg>(table: T, values: Omit<T["$inferInsert"], "organisationId">): Promise<T["$inferSelect"]> {
    const rows = (await this.ex
      .insert(table as PgTable)
      .values({ ...(values as object), organisationId: this.orgId })
      .returning()) as T["$inferSelect"][];
    return rows[0];
  }

  async update<T extends WithOrg>(table: T, id: string, values: Partial<T["$inferInsert"]>): Promise<T["$inferSelect"] | undefined> {
    const { organisationId: _drop, ...safe } = values as Record<string, unknown>;
    void _drop;
    const rows = (await this.ex
      .update(table as PgTable)
      .set(safe)
      .where(this.where(table, eq(table.id, id)))
      .returning()) as T["$inferSelect"][];
    return rows[0];
  }

  async delete<T extends WithOrg>(table: T, id: string): Promise<boolean> {
    const rows = (await this.ex.delete(table as PgTable).where(this.where(table, eq(table.id, id))).returning()) as unknown[];
    return rows.length > 0;
  }

  /** Raw access for joins. Every from() on a tenant table must still use where(). */
  get raw(): Executor {
    return this.ex;
  }

  /** Run several writes atomically inside one scope. */
  transaction<R>(fn: (scope: Scope) => Promise<R>): Promise<R> {
    if (this.ex !== db) return fn(this);
    return db.transaction((tx) => fn(new Scope(this.orgId, tx)));
  }
}

export function scoped(orgId: string): Scope {
  return new Scope(orgId);
}
