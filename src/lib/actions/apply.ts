"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { TZDate } from "@date-fns/tz";
import { auth } from "@/lib/auth";
import { requirePermission, type Actor } from "@/lib/session";
import { updateOrganisation } from "@/lib/db/queries";
import { appointment, auditEvent, owner, pet, provider, reminder, service, visit } from "@/lib/db/schema";
import type { Scope } from "@/lib/db/scoped";
import type { Permission } from "@/lib/roles";
import { actionSchema, type ActionResult, type StoreAction } from "./types";

// One server action, one command handler. The screens dispatch the same
// discriminated union the prototype's reducer took. Here it is validated,
// permission checked against the membership on the server, applied through
// the organisation's scope, and written to the audit trail.

const permissionFor: Record<StoreAction["type"], Permission> = {
  "appointment/status": "manage_appointments",
  "appointment/reschedule": "manage_appointments",
  "appointment/create": "manage_appointments",
  "appointment/note": "manage_appointments",
  "visit/add": "add_visit",
  "owner/upsert": "edit_clients",
  "pet/upsert": "edit_clients",
  "service/upsert": "view_settings",
  "service/archive": "view_settings",
  "provider/upsert": "view_settings",
  "provider/archive": "view_settings",
  "member/invite": "view_settings",
  "member/role": "view_settings",
  "member/remove": "view_settings",
  "invitation/cancel": "view_settings",
  "reminder/sent": "view_recall",
  "reminder/unsend": "view_recall",
  "org/update": "view_settings",
};

const statusVerbs: Record<string, string> = {
  booked: "Reopened appointment",
  confirmed: "Confirmed appointment",
  arrived: "Marked arrived",
  completed: "Marked completed",
  cancelled: "Cancelled appointment",
  no_show: "Marked no-show",
};

function reference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KLG-";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function audit(scope: Scope, actor: Actor, action: string, entityType: (typeof auditEvent.$inferInsert)["entityType"], entityId: string, entityLabel: string, before?: Record<string, unknown>, after?: Record<string, unknown>) {
  await scope.insert(auditEvent, { actorMemberId: actor.member.id, actorName: actor.session.user.name, action, entityType, entityId, entityLabel, before, after });
}

async function labelFor(scope: Scope, appt: typeof appointment.$inferSelect): Promise<string> {
  const [p, s] = await Promise.all([scope.byId(pet, appt.petId), appt.serviceId ? scope.byId(service, appt.serviceId) : Promise.resolve(undefined)]);
  return `${p?.name ?? "Pet"}, ${s?.name ?? "walk-in"}`;
}

export async function applyAction(orgSlug: string, raw: unknown): Promise<ActionResult> {
  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(". ") };
  const action = parsed.data;

  let actor: Actor;
  try {
    actor = await requirePermission(orgSlug, permissionFor[action.type]);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Not allowed" };
  }
  const { scope, org } = actor;

  try {
    const result = await handle(action, actor, scope);
    revalidatePath(`/app/${org.slug}`, "layout");
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong";
    if (/appointment_no_overlap/.test(message)) return { ok: false, error: "That slot was just taken. Pick another time." };
    return { ok: false, error: message };
  }
}

async function handle(action: StoreAction, actor: Actor, scope: Scope): Promise<ActionResult> {
  switch (action.type) {
    case "appointment/status": {
      const appt = await scope.byId(appointment, action.id);
      if (!appt) return { ok: false, error: "That appointment is not on file" };
      await scope.update(appointment, appt.id, { status: action.status, cancelReason: action.status === "cancelled" ? action.reason ?? null : appt.cancelReason });
      await audit(scope, actor, statusVerbs[action.status], "appointment", appt.id, await labelFor(scope, appt), { status: appt.status }, { status: action.status, ...(action.reason ? { reason: action.reason } : {}) });
      return { ok: true };
    }
    case "appointment/reschedule": {
      const appt = await scope.byId(appointment, action.id);
      if (!appt) return { ok: false, error: "That appointment is not on file" };
      await scope.update(appointment, appt.id, { startsAt: new Date(action.startsAt), endsAt: new Date(action.endsAt), providerId: action.providerId ?? appt.providerId, status: appt.status === "cancelled" ? "booked" : appt.status });
      await audit(scope, actor, "Rescheduled appointment", "appointment", appt.id, await labelFor(scope, appt), { startsAt: appt.startsAt.toISOString() }, { startsAt: action.startsAt });
      return { ok: true };
    }
    case "appointment/create": {
      const a = action.appointment;
      const [p, pr] = await Promise.all([scope.byId(pet, a.petId), scope.byId(provider, a.providerId)]);
      if (!p || !pr) return { ok: false, error: "The pet or the vet is not on file" };
      if (p.ownerId !== a.ownerId) return { ok: false, error: "That pet does not belong to that client" };
      let created: typeof appointment.$inferSelect | undefined;
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        try {
          created = await scope.insert(appointment, { ...a, reference: reference(), startsAt: new Date(a.startsAt), endsAt: new Date(a.endsAt), createdByMemberId: actor.member.id });
        } catch (e) {
          if (!(e instanceof Error) || !/appointment_org_reference_idx/.test(e.message)) throw e;
        }
      }
      if (!created) return { ok: false, error: "Could not find a free reference. Try again." };
      await audit(scope, actor, a.source === "walk_in" ? "Added walk-in" : "Booked at the desk", "appointment", created.id, await labelFor(scope, created), undefined, { status: created.status, startsAt: created.startsAt.toISOString() });
      return { ok: true, id: created.id };
    }
    case "appointment/note": {
      const appt = await scope.byId(appointment, action.id);
      if (!appt) return { ok: false, error: "That appointment is not on file" };
      await scope.update(appointment, appt.id, { note: action.note || null });
      return { ok: true };
    }
    case "visit/add": {
      const v = action.visit;
      const appt = await scope.byId(appointment, v.appointmentId);
      const p = await scope.byId(pet, v.petId);
      if (!appt || !p || appt.petId !== p.id) return { ok: false, error: "That appointment and pet do not match" };
      const svc = appt.serviceId ? await scope.byId(service, appt.serviceId) : undefined;
      const at = v.at ? new Date(v.at) : new Date();
      const day = new TZDate(at, actor.org.timezone).toISOString().slice(0, 10);
      const created = await scope.transaction(async (sc) => {
        const row = await sc.insert(visit, { appointmentId: appt.id, petId: p.id, providerId: v.providerId, at, weightKg: v.weightKg?.toString(), notes: v.notes, administered: v.administered, paymentMethod: v.paymentMethod, paymentRef: v.paymentRef, createdByMemberId: actor.member.id });
        await sc.update(pet, p.id, {
          weightKg: v.weightKg?.toString() ?? p.weightKg,
          lastVaccination: svc?.recallKind === "vaccination" ? day : p.lastVaccination,
          lastDeworming: svc?.recallKind === "deworming" ? day : p.lastDeworming,
          lastGroom: svc?.recallKind === "grooming" ? day : p.lastGroom,
        });
        await sc.update(appointment, appt.id, { status: "completed" });
        return row;
      });
      await audit(scope, actor, "Added visit", "visit", created.id, `${p.name}, ${svc?.name ?? "visit"}`, undefined, { weightKg: v.weightKg, administered: v.administered });
      return { ok: true, id: created.id };
    }
    case "owner/upsert": {
      const o = action.owner;
      if (o.id) {
        const existing = await scope.byId(owner, o.id);
        if (!existing) return { ok: false, error: "That client is not on file" };
        await scope.update(owner, o.id, { name: o.name, mobile: o.mobile ?? null, email: o.email ?? null, notes: o.notes ?? null });
        await audit(scope, actor, "Edited client", "owner", o.id, o.name, { name: existing.name, mobile: existing.mobile }, { name: o.name, mobile: o.mobile });
        return { ok: true, id: o.id };
      }
      const created = await scope.insert(owner, { name: o.name, mobile: o.mobile, email: o.email, notes: o.notes });
      await audit(scope, actor, "Added client", "owner", created.id, o.name, undefined, { name: o.name, mobile: o.mobile });
      return { ok: true, id: created.id };
    }
    case "pet/upsert": {
      const p = action.pet;
      const o = await scope.byId(owner, p.ownerId);
      if (!o) return { ok: false, error: "That client is not on file" };
      const values = { ownerId: p.ownerId, name: p.name, species: p.species, breed: p.breed, sex: p.sex, birthDate: p.birthDate ?? null, weightKg: p.weightKg?.toString() ?? null, notes: p.notes ?? null, lastVaccination: p.lastVaccination ?? null, lastDeworming: p.lastDeworming ?? null, lastGroom: p.lastGroom ?? null };
      if (p.id) {
        const existing = await scope.byId(pet, p.id);
        if (!existing) return { ok: false, error: "That pet is not on file" };
        await scope.update(pet, p.id, values);
        await audit(scope, actor, "Edited pet", "pet", p.id, p.name, { name: existing.name, breed: existing.breed }, { name: p.name, breed: p.breed });
        return { ok: true, id: p.id };
      }
      const created = await scope.insert(pet, values);
      await audit(scope, actor, "Added pet", "pet", created.id, p.name, undefined, { name: p.name, breed: p.breed });
      return { ok: true, id: created.id };
    }
    case "service/upsert": {
      const s = action.service;
      const values = { name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, pricePhp: s.pricePhp, publiclyBookable: s.publiclyBookable, recallKind: s.recallKind ?? null };
      if (s.id) {
        const existing = await scope.byId(service, s.id);
        if (!existing) return { ok: false, error: "That service is not on file" };
        await scope.update(service, s.id, values);
        await audit(scope, actor, "Edited service", "service", s.id, s.name, { pricePhp: existing.pricePhp, durationMin: existing.durationMin }, { pricePhp: s.pricePhp, durationMin: s.durationMin });
        return { ok: true, id: s.id };
      }
      const created = await scope.insert(service, values);
      await audit(scope, actor, "Added service", "service", created.id, s.name, undefined, { pricePhp: s.pricePhp, durationMin: s.durationMin });
      return { ok: true, id: created.id };
    }
    case "service/archive": {
      const existing = await scope.byId(service, action.id);
      if (!existing) return { ok: false, error: "That service is not on file" };
      await scope.update(service, action.id, { archivedAt: new Date(), publiclyBookable: false });
      await audit(scope, actor, "Archived service", "service", action.id, existing.name);
      return { ok: true };
    }
    case "provider/upsert": {
      const p = action.provider;
      const values = { name: p.name, title: p.title, memberId: p.memberId ?? null, ...(p.weeklyHours ? { weeklyHours: p.weeklyHours } : {}), ...(p.exceptions ? { exceptions: p.exceptions } : {}) };
      if (p.id) {
        const existing = await scope.byId(provider, p.id);
        if (!existing) return { ok: false, error: "That person is not on the schedule" };
        await scope.update(provider, p.id, values);
        const what = p.exceptions ? "Updated closures" : p.weeklyHours ? "Updated working hours" : "Edited schedule entry";
        await audit(scope, actor, what, "provider", p.id, p.name, { days: existing.weeklyHours.map((r) => r.day).join(","), closures: existing.exceptions.length }, { days: (p.weeklyHours ?? existing.weeklyHours).map((r) => r.day).join(","), closures: (p.exceptions ?? existing.exceptions).length });
        return { ok: true, id: p.id };
      }
      const created = await scope.insert(provider, { ...values, weeklyHours: p.weeklyHours ?? [1, 2, 3, 4, 5, 6].map((day) => ({ day, from: actor.org.openFrom, to: actor.org.openTo })), exceptions: p.exceptions ?? [] });
      await audit(scope, actor, "Added to the schedule", "provider", created.id, `${p.name}, ${p.title}`);
      return { ok: true, id: created.id };
    }
    case "provider/archive": {
      const existing = await scope.byId(provider, action.id);
      if (!existing) return { ok: false, error: "That person is not on the schedule" };
      await scope.update(provider, action.id, { archivedAt: new Date() });
      await audit(scope, actor, "Removed from the schedule", "provider", action.id, existing.name);
      return { ok: true };
    }
    case "member/invite": {
      const res = await auth.api.createInvitation({ headers: await headers(), body: { email: action.member.email, role: action.member.role, organizationId: actor.org.id, resend: true } });
      await audit(scope, actor, "Invited member", "member", res.id, `${action.member.email}, ${action.member.role.replace("_", " ")}`);
      return { ok: true, id: res.id, message: process.env.RESEND_API_KEY ? "Invitation sent" : `Invitation created. Nothing is emailed yet, share this link: ${process.env.BETTER_AUTH_URL}/invite/${res.id}` };
    }
    case "member/role": {
      const before = actor.member.id === action.id ? actor.member.role : undefined;
      if (actor.member.id === action.id) return { ok: false, error: "Ask another owner to change your own role" };
      await auth.api.updateMemberRole({ headers: await headers(), body: { memberId: action.id, role: action.role, organizationId: actor.org.id } });
      await audit(scope, actor, "Changed role", "member", action.id, action.id, before ? { role: before } : undefined, { role: action.role });
      return { ok: true };
    }
    case "member/remove": {
      if (actor.member.id === action.id) return { ok: false, error: "You cannot remove yourself" };
      await auth.api.removeMember({ headers: await headers(), body: { memberIdOrEmail: action.id, organizationId: actor.org.id } });
      await audit(scope, actor, "Removed member", "member", action.id, action.id);
      return { ok: true };
    }
    case "invitation/cancel": {
      await auth.api.cancelInvitation({ headers: await headers(), body: { invitationId: action.id } });
      await audit(scope, actor, "Cancelled invitation", "member", action.id, action.id);
      return { ok: true };
    }
    case "reminder/sent":
    case "reminder/unsend": {
      const r = await scope.byId(reminder, action.id);
      if (!r) return { ok: false, error: "That reminder is not on file" };
      const sent = action.type === "reminder/sent";
      await scope.update(reminder, r.id, { sentAt: sent ? new Date() : null, sentByMemberId: sent ? actor.member.id : null });
      const p = await scope.byId(pet, r.petId);
      await audit(scope, actor, sent ? "Marked reminder sent" : "Unmarked reminder", "reminder", r.id, `${p?.name ?? "Pet"}, ${r.kind}`);
      return { ok: true };
    }
    case "org/update": {
      const changes = { ...action.changes, email: action.changes.email === "" ? null : action.changes.email };
      await updateOrganisation(actor.org.id, changes);
      await audit(scope, actor, "Updated clinic settings", "organisation", actor.org.id, actor.org.name, undefined, action.changes as Record<string, unknown>);
      return { ok: true };
    }
  }
}

/** Convenience for pages that need to read one appointment id back after a create. */
export async function findAppointmentReference(orgSlug: string, id: string): Promise<string | null> {
  const actor = await requirePermission(orgSlug, "day_view");
  const appt = await actor.scope.byId(appointment, id);
  return appt?.reference ?? null;
}
