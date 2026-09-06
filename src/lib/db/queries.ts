import "server-only";
import { and, desc, eq, gte, inArray, isNull, lte, ne, notInArray } from "drizzle-orm";
import { TZDate } from "@date-fns/tz";
import { addDays, format, subDays } from "date-fns";
import { db } from "./client";
import { appointment, auditEvent, invitation, member, organization, owner, pet, provider, reminder, service, user, visit, rateLimit } from "./schema";
import { scoped, type Scope } from "./scoped";
import type * as Row from "./types";
import type * as View from "@/lib/domain/types";
import { dueItems } from "@/lib/domain/recall";
import { visibleSnapshot } from "@/lib/domain/visibility";
import { renderReminder } from "@/content/templates";
import { openSlots, type Busy, type Slot } from "@/lib/availability";
import { can, isRole, type Role } from "@/lib/roles";

// Every read the screens need, in one place, returning view models. Tenant
// tables are only ever touched through a Scope. The organisation, member and
// invitation tables belong to Better Auth and are keyed by organisation
// directly.

const iso = (d: Date | string | null | undefined) => (d ? (typeof d === "string" ? d : d.toISOString()) : undefined);
const num = (n: string | number | null | undefined) => (n === null || n === undefined ? undefined : Number(n));
const nn = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

export function toOrganisation(o: Row.Organisation): View.Organisation {
  return {
    id: o.id,
    slug: o.slug,
    name: o.name,
    city: o.city ?? "",
    address: o.address ?? "",
    mobile: o.mobile ?? "",
    email: o.email ?? "",
    timezone: o.timezone,
    openFrom: o.openFrom,
    openTo: o.openTo,
    groomingIntervalWeeks: o.groomingIntervalWeeks,
  };
}

const toService = (s: Row.Service): View.Service => ({ id: s.id, organisationId: s.organisationId, name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, pricePhp: s.pricePhp, publiclyBookable: s.publiclyBookable, recallKind: nn(s.recallKind) });
const toProvider = (p: Row.Provider): View.Provider => ({ id: p.id, organisationId: p.organisationId, name: p.name, title: p.title, memberId: nn(p.memberId), weeklyHours: p.weeklyHours, exceptions: p.exceptions });
const toOwner = (o: Row.Owner): View.Owner => ({ id: o.id, organisationId: o.organisationId, name: o.name, mobile: nn(o.mobile), email: nn(o.email), notes: nn(o.notes), createdAt: o.createdAt.toISOString() });
const toPet = (p: Row.Pet): View.Pet => ({ id: p.id, organisationId: p.organisationId, ownerId: p.ownerId, name: p.name, species: p.species, breed: p.breed, sex: p.sex, birthDate: p.birthDate ?? "", weightKg: num(p.weightKg), lastVaccination: nn(p.lastVaccination), lastDeworming: nn(p.lastDeworming), lastGroom: nn(p.lastGroom), notes: nn(p.notes) });
const toAppointment = (a: Row.Appointment): View.Appointment => ({ id: a.id, organisationId: a.organisationId, reference: a.reference, ownerId: a.ownerId, petId: a.petId, serviceId: a.serviceId, providerId: a.providerId, startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), status: a.status, source: a.source, note: nn(a.note), cancelReason: nn(a.cancelReason), createdAt: a.createdAt.toISOString() });
const toVisit = (v: Row.Visit): View.Visit => ({ id: v.id, organisationId: v.organisationId, appointmentId: v.appointmentId, petId: v.petId, providerId: v.providerId, at: v.at.toISOString(), weightKg: num(v.weightKg), notes: v.notes, administered: v.administered, paymentMethod: nn(v.paymentMethod), paymentRef: nn(v.paymentRef) });
const toReminder = (r: Row.Reminder): View.Reminder => ({ id: r.id, organisationId: r.organisationId, petId: r.petId, kind: r.kind, dueOn: r.dueOn, message: r.message, generatedAt: r.generatedAt.toISOString(), sentAt: iso(r.sentAt), sentByMemberId: nn(r.sentByMemberId) });
const toAudit = (e: Row.AuditEvent): View.AuditEvent => ({ id: e.id, organisationId: e.organisationId, actorMemberId: e.actorMemberId ?? "", actorName: e.actorName, action: e.action, entityType: e.entityType, entityId: e.entityId, entityLabel: e.entityLabel, before: nn(e.before), after: nn(e.after), at: e.at.toISOString() });

export async function getOrganisationBySlug(slug: string): Promise<Row.Organisation | undefined> {
  const [row] = await db.select().from(organization).where(eq(organization.slug, slug)).limit(1);
  return row;
}

export async function getOrganisationById(id: string): Promise<Row.Organisation | undefined> {
  const [row] = await db.select().from(organization).where(eq(organization.id, id)).limit(1);
  return row;
}

export async function updateOrganisation(id: string, changes: Partial<Pick<Row.Organisation, "name" | "address" | "city" | "mobile" | "email" | "timezone" | "openFrom" | "openTo" | "groomingIntervalWeeks">>) {
  const [row] = await db.update(organization).set(changes).where(eq(organization.id, id)).returning();
  return row;
}

export async function listMembers(orgId: string): Promise<View.Member[]> {
  const rows = await db
    .select({ m: member, u: user })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId));
  const providers = await scoped(orgId).list(provider);
  return rows.map(({ m, u }) => ({
    id: m.id,
    organisationId: m.organizationId,
    userId: m.userId,
    name: u.name,
    email: u.email,
    role: isRole(m.role) ? m.role : "front_desk",
    providerId: providers.find((p) => p.memberId === m.id)?.id,
    invitedAt: m.createdAt.toISOString(),
  }));
}

export async function listInvitations(orgId: string): Promise<View.Invitation[]> {
  const rows = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.organizationId, orgId), eq(invitation.status, "pending"), gte(invitation.expiresAt, new Date())));
  return rows.map((i) => ({ id: i.id, organisationId: i.organizationId, email: i.email, role: isRole(i.role ?? "") ? (i.role as View.Role) : "front_desk", status: i.status, expiresAt: i.expiresAt.toISOString(), createdAt: i.createdAt.toISOString() }));
}

/**
 * Reminders are derived from the recall rules and written once per pet, kind
 * and due date, so the sent state survives. Called before the queue is read.
 */
export async function ensureReminders(scope: Scope, org: View.Organisation): Promise<void> {
  const pets = await scope.list(pet);
  if (!pets.length) return;
  const owners = await scope.list(owner);
  const rows: Omit<Row.NewReminder, "organisationId">[] = [];
  for (const p of pets) {
    const o = owners.find((x) => x.id === p.ownerId);
    for (const d of dueItems(toPet(p), org)) {
      if (!d.dueOn || d.days === undefined || d.days < -21 || d.days > 14) continue;
      rows.push({
        petId: p.id,
        kind: d.kind,
        dueOn: d.dueOn,
        message: renderReminder(d.kind, { petName: p.name, ownerName: (o?.name ?? "there").split(" ")[0], clinicName: org.name, dueOn: d.dueOn, bookingUrl: `kalinga.cjjutba.dev/${org.slug}` }),
      });
    }
  }
  if (!rows.length) return;
  await scope.raw
    .insert(reminder)
    .values(rows.map((r) => ({ ...r, organisationId: scope.orgId })))
    .onConflictDoNothing();
}

/**
 * Everything the staff shell renders, filtered through visibleSnapshot so the
 * audit trail, pending invitations and visit notes leave the server only for
 * roles that hold the matching permission. The two heaviest reads are also
 * skipped outright for roles that would never receive them.
 */
export async function loadOrgSnapshot(orgRow: Row.Organisation, role: Role): Promise<View.OrgSnapshot> {
  const scope = scoped(orgRow.id);
  const organisation = toOrganisation(orgRow);
  const now = new Date();
  await ensureReminders(scope, organisation);
  const [members, invitations, services, providers, owners, pets, appointments, visits, reminders, audit] = await Promise.all([
    listMembers(orgRow.id),
    can(role, "view_settings") ? listInvitations(orgRow.id) : Promise.resolve([]),
    scope.list(service, isNull(service.archivedAt)),
    scope.list(provider, isNull(provider.archivedAt)),
    scope.list(owner),
    scope.list(pet),
    scope.list(appointment, gte(appointment.startsAt, subDays(now, 60)), lte(appointment.startsAt, addDays(now, 120))),
    scope.list(visit),
    scope.list(reminder, gte(reminder.dueOn, format(subDays(now, 60), "yyyy-MM-dd"))),
    can(role, "view_audit") ? scope.raw.select().from(auditEvent).where(scope.where(auditEvent)).orderBy(desc(auditEvent.at)).limit(300) : Promise.resolve([]),
  ]);
  return visibleSnapshot({
    organisation,
    members,
    invitations,
    services: services.map(toService),
    providers: providers.map(toProvider),
    owners: owners.map(toOwner),
    pets: pets.map(toPet),
    appointments: appointments.map(toAppointment).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    visits: visits.map(toVisit),
    reminders: reminders.map(toReminder),
    audit: (audit as Row.AuditEvent[]).map(toAudit),
  }, role);
}

/** The public face of a clinic: what a pet owner sees before booking. */
export async function getPublicClinic(slug: string) {
  const orgRow = await getOrganisationBySlug(slug);
  if (!orgRow) return null;
  const scope = scoped(orgRow.id);
  const [services, providers] = await Promise.all([scope.list(service, and(isNull(service.archivedAt), eq(service.publiclyBookable, true))), scope.list(provider, isNull(provider.archivedAt))]);
  return { organisation: toOrganisation(orgRow), services: services.map(toService), providers: providers.map(toProvider) };
}

export async function getBusy(scope: Scope, from: Date, to: Date, excludeAppointmentId?: string): Promise<Busy[]> {
  const rows = await scope.list(appointment, gte(appointment.startsAt, from), lte(appointment.startsAt, to), notInArray(appointment.status, ["cancelled", "no_show"]), excludeAppointmentId ? ne(appointment.id, excludeAppointmentId) : undefined);
  return rows.map((a) => ({ startsAt: a.startsAt.toISOString(), endsAt: a.endsAt.toISOString(), providerId: a.providerId }));
}

/** Open slots for a service with one provider or any, keyed by clinic day. Never exposes other people's appointments. */
export async function computeOpenSlots(orgRow: Row.Organisation, opts: { serviceId: string; providerId: string | "any"; from: Date; days: number; excludeAppointmentId?: string }): Promise<Record<string, Slot[]>> {
  const scope = scoped(orgRow.id);
  const svc = await scope.byId(service, opts.serviceId);
  if (!svc) return {};
  const providers = (await scope.list(provider, isNull(provider.archivedAt))).filter((p) => opts.providerId === "any" || p.id === opts.providerId);
  const busy = await getBusy(scope, subDays(opts.from, 1), addDays(opts.from, opts.days + 1), opts.excludeAppointmentId);
  return openSlots({
    providers: providers.map((p) => ({ id: p.id, weeklyHours: p.weeklyHours, exceptions: p.exceptions })),
    busy,
    durationMin: svc.durationMin,
    bufferMin: svc.bufferMin,
    from: opts.from,
    days: opts.days,
    timezone: orgRow.timezone,
    notBefore: new Date(),
  });
}

export async function getBookingByReference(slug: string, reference: string) {
  const orgRow = await getOrganisationBySlug(slug);
  if (!orgRow) return null;
  const scope = scoped(orgRow.id);
  const appt = await scope.one(appointment, eq(appointment.reference, reference));
  if (!appt) return null;
  const [p, o, s, pr] = await Promise.all([scope.byId(pet, appt.petId), scope.byId(owner, appt.ownerId), appt.serviceId ? scope.byId(service, appt.serviceId) : Promise.resolve(undefined), scope.byId(provider, appt.providerId)]);
  return {
    organisation: toOrganisation(orgRow),
    appointment: toAppointment(appt),
    pet: p ? toPet(p) : undefined,
    owner: o ? toOwner(o) : undefined,
    service: s ? toService(s) : undefined,
    provider: pr ? toProvider(pr) : undefined,
  };
}

/**
 * Everything a pet owner may see: their own owner records across clinics,
 * matched by the email they signed in with. The first statement is the identity
 * lookup; every tenant read after it is scoped to the organisations found.
 */
export async function getPortalData(email: string) {
  const ownerRows = (await db.select().from(owner).where(eq(owner.email, email))) as Row.Owner[]; /* identity lookup */
  const orgIds = [...new Set(ownerRows.map((o) => o.organisationId))];
  if (!orgIds.length) return { organisations: [], owners: [], pets: [], appointments: [], visits: [], services: [], providers: [] };
  const orgRows = await db.select().from(organization).where(inArray(organization.id, orgIds));
  const parts = await Promise.all(
    orgIds.map(async (orgId) => {
      const scope = scoped(orgId);
      const myOwnerIds = ownerRows.filter((o) => o.organisationId === orgId).map((o) => o.id);
      const [pets, appointments, services, providers] = await Promise.all([scope.list(pet, inArray(pet.ownerId, myOwnerIds)), scope.list(appointment, inArray(appointment.ownerId, myOwnerIds)), scope.list(service), scope.list(provider)]);
      const visits = pets.length ? await scope.list(visit, inArray(visit.petId, pets.map((p) => p.id))) : [];
      return { pets, appointments, visits, services, providers };
    }),
  );
  return {
    organisations: orgRows.map(toOrganisation),
    owners: ownerRows.map(toOwner),
    pets: parts.flatMap((p) => p.pets).map(toPet),
    appointments: parts.flatMap((p) => p.appointments).map(toAppointment).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    visits: parts.flatMap((p) => p.visits).map(toVisit),
    services: parts.flatMap((p) => p.services).map(toService),
    providers: parts.flatMap((p) => p.providers).map(toProvider),
  };
}

/** What an invitee sees before signing in: enough to decide, nothing more. */
export async function getInvitationPublic(id: string) {
  const [row] = await db
    .select({ inv: invitation, org: organization, inviter: user })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(eq(invitation.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.inv.id,
    email: row.inv.email,
    role: isRole(row.inv.role ?? "") ? (row.inv.role as View.Role) : ("front_desk" as View.Role),
    status: row.inv.status,
    expired: row.inv.expiresAt.getTime() < Date.now(),
    clinic: row.org.name,
    slug: row.org.slug,
    inviter: row.inviter.name,
  };
}

/** Fixed window rate limit per key, backed by Postgres so nothing new is paid for. Returns true when the call is allowed. */
export async function allowRate(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  const [row] = await db.select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1);
  if (!row || now.getTime() - row.windowStart.getTime() > windowSeconds * 1000) {
    await db.insert(rateLimit).values({ key, count: 1, windowStart: now }).onConflictDoUpdate({ target: rateLimit.key, set: { count: 1, windowStart: now } });
    return true;
  }
  if (row.count >= limit) return false;
  await db.update(rateLimit).set({ count: row.count + 1 }).where(eq(rateLimit.key, key));
  return true;
}

export { TZDate };
