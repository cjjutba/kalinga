import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db/client";
import { member, organization } from "./db/schema";
import { scoped, type Scope } from "./db/scoped";
import { can, type Permission } from "./roles";
import type { Member, Organisation, Role } from "./db/types";

// Who is asking, and for which clinic. Every staff page and every server
// action starts here. The membership row is read from the database on each
// request, so a revoked member is out on their next click, not their next
// sign in.

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export interface Actor {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  org: Organisation;
  member: Member;
  role: Role;
  scope: Scope;
}

export const requireMember = cache(async (orgSlug: string): Promise<Actor> => {
  const session = await requireSession();
  const [org] = await db.select().from(organization).where(eq(organization.slug, orgSlug)).limit(1);
  if (!org) notFound();
  const [m] = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, org.id), eq(member.userId, session.user.id)))
    .limit(1);
  if (!m) redirect("/app");
  return { session, org, member: m, role: m.role as Role, scope: scoped(org.id) };
});

/** Throws when the role lacks the permission. Used at the top of every action. */
export async function requirePermission(orgSlug: string, permission: Permission): Promise<Actor> {
  const actor = await requireMember(orgSlug);
  if (!can(actor.role, permission)) throw new Error(`The ${actor.role} role cannot ${permission.replace(/_/g, " ")}`);
  return actor;
}

/**
 * For pages. When the role lacks the permission the request ends in a 403
 * rendered by the nearest forbidden.tsx, so a guessed URL returns a refusal
 * rather than a shell with nothing in it. The action path uses
 * requirePermission and returns the error to the caller instead.
 */
export async function requirePagePermission(orgSlug: string, permission: Permission): Promise<Actor> {
  const actor = await requireMember(orgSlug);
  if (!can(actor.role, permission)) forbidden();
  return actor;
}

/**
 * Whether this account may open another clinic. The same rule the auth plugin
 * enforces: owners can, staff at someone else's clinic cannot, and an account
 * with no clinic yet has to be able to make its first.
 */
export async function mayCreateOrganisation(): Promise<boolean> {
  const rows = await listMemberships();
  return rows.length === 0 || rows.some((r) => r.member.role === "owner");
}

/** The organisations the signed in user belongs to, for choose clinic and the switcher. */
export async function listMemberships() {
  const session = await requireSession();
  return db
    .select({ member, org: organization })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, session.user.id));
}
