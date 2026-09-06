"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { bookingInput, manageInput } from "./schemas";
import { eq } from "drizzle-orm";
import { allowRate, getOrganisationBySlug } from "@/lib/db/queries";
import { scoped } from "@/lib/db/scoped";
import { appointment, auditEvent, owner, pet, provider, service } from "@/lib/db/schema";
import { isFree } from "@/lib/availability";
import { getBusy } from "@/lib/db/queries";
import { subDays, addDays } from "date-fns";
import { notifyOwnerOfBooking } from "./notify";

// The unauthenticated write path. Rate limited per IP through a Postgres
// table, a honeypot field that must stay empty, validation, and then the
// booking inside a transaction. The availability engine checks the slot and
// the database exclusion constraint checks it again, so two people confirming
// the same time cannot both succeed.

export type BookingResult = { ok: true; reference: string; emailed: boolean } | { ok: false; error: string; code?: "taken" | "limited" };

function reference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KLG-";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function bookAppointment(raw: unknown): Promise<BookingResult> {
  const parsed = bookingInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields." };
  const input = parsed.data;

  const ip = await clientIp();
  if (!(await allowRate(`book:${ip}`, 5, 15 * 60))) return { ok: false, error: "Too many bookings from this connection. Try again in a few minutes.", code: "limited" };

  const orgRow = await getOrganisationBySlug(input.orgSlug);
  if (!orgRow) return { ok: false, error: "That clinic is not on Kalinga." };
  const scope = scoped(orgRow.id);
  const [svc, prov] = await Promise.all([scope.byId(service, input.serviceId), scope.byId(provider, input.providerId)]);
  if (!svc || !svc.publiclyBookable || svc.archivedAt) return { ok: false, error: "That service cannot be booked online." };
  if (!prov || prov.archivedAt) return { ok: false, error: "That vet is not taking bookings." };

  const startsAt = new Date(input.startsAt);
  if (startsAt.getTime() < Date.now()) return { ok: false, error: "That time has passed. Pick another.", code: "taken" };
  const endsAt = new Date(startsAt.getTime() + svc.durationMin * 60_000);

  try {
    const created = await scope.transaction(async (sc) => {
      const busy = await getBusy(sc, subDays(startsAt, 1), addDays(startsAt, 1));
      if (!isFree({ id: prov.id, weeklyHours: prov.weeklyHours, exceptions: prov.exceptions }, startsAt, svc.durationMin, svc.bufferMin, busy, orgRow.timezone)) {
        throw new Error("appointment_no_overlap");
      }
      // One owner per mobile per clinic. Returning clients are matched, not duplicated.
      const existing = input.mobile ? await sc.one(owner, eq(owner.mobile, input.mobile)) : undefined;
      const ownerRow = existing ?? (await sc.insert(owner, { name: input.name, mobile: input.mobile, email: input.email || undefined }));
      const petRow = await sc.insert(pet, { ownerId: ownerRow.id, name: input.petName, species: input.species, breed: input.species === "dog" ? "Aspin" : "Puspin", sex: "male" });
      let appt: typeof appointment.$inferSelect | undefined;
      for (let attempt = 0; attempt < 5 && !appt; attempt++) {
        try {
          appt = await sc.insert(appointment, { reference: reference(), ownerId: ownerRow.id, petId: petRow.id, serviceId: svc.id, providerId: prov.id, startsAt, endsAt, status: "booked", source: "online", note: input.notes || undefined });
        } catch (e) {
          if (!(e instanceof Error) || !/appointment_org_reference_idx/.test(e.message)) throw e;
        }
      }
      if (!appt) throw new Error("Could not allocate a reference");
      await sc.insert(auditEvent, { actorMemberId: null, actorName: input.name, action: "Booked online", entityType: "appointment", entityId: appt.id, entityLabel: `${petRow.name}, ${svc.name}`, after: { status: "booked", startsAt: appt.startsAt.toISOString() } });
      return appt;
    });
    const emailed = await notifyOwnerOfBooking(scope, orgRow, created, "confirmed");
    return { ok: true, reference: created.reference, emailed };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (/appointment_no_overlap/.test(message)) return { ok: false, error: "That slot was just taken. Pick another time.", code: "taken" };
    return { ok: false, error: "The booking did not go through. Nothing was saved. Try again or call the clinic." };
  }
}

/** The pet owner cancels their own booking. The reference on their confirmation is the key. */
export async function cancelBooking(raw: unknown): Promise<{ ok: boolean; error?: string; emailed?: boolean }> {
  const p = manageInput.safeParse(raw);
  if (!p.success) return { ok: false, error: "That link is not right." };
  if (!(await allowRate(`manage:${await clientIp()}`, 20, 15 * 60))) return { ok: false, error: "Too many changes. Try again in a few minutes." };
  const orgRow = await getOrganisationBySlug(p.data.orgSlug);
  if (!orgRow) return { ok: false, error: "That clinic is not on Kalinga." };
  const scope = scoped(orgRow.id);
  const appt = await scope.one(appointment, eq(appointment.reference, p.data.reference));
  if (!appt) return { ok: false, error: "We could not find that booking." };
  if (appt.status === "completed" || appt.startsAt.getTime() < Date.now()) return { ok: false, error: "That appointment has already happened." };
  const ownerRow = await scope.byId(owner, appt.ownerId);
  await scope.update(appointment, appt.id, { status: "cancelled", cancelReason: "Cancelled by the owner online" });
  await scope.insert(auditEvent, { actorMemberId: null, actorName: ownerRow?.name ?? "Pet owner", action: "Cancelled appointment", entityType: "appointment", entityId: appt.id, entityLabel: appt.reference, before: { status: appt.status }, after: { status: "cancelled", reason: "Cancelled by the owner online" } });
  const emailed = await notifyOwnerOfBooking(scope, orgRow, { ...appt, status: "cancelled" }, "cancelled");
  return { ok: true, emailed };
}

export async function rescheduleBooking(raw: unknown): Promise<{ ok: boolean; error?: string; code?: "taken"; emailed?: boolean }> {
  const p = manageInput.extend({ startsAt: z.string().datetime({ offset: true }) }).safeParse(raw);
  if (!p.success) return { ok: false, error: "That link is not right." };
  if (!(await allowRate(`manage:${await clientIp()}`, 20, 15 * 60))) return { ok: false, error: "Too many changes. Try again in a few minutes." };
  const orgRow = await getOrganisationBySlug(p.data.orgSlug);
  if (!orgRow) return { ok: false, error: "That clinic is not on Kalinga." };
  const scope = scoped(orgRow.id);
  const appt = await scope.one(appointment, eq(appointment.reference, p.data.reference));
  if (!appt) return { ok: false, error: "We could not find that booking." };
  if (appt.status === "completed" || appt.status === "cancelled") return { ok: false, error: "That booking cannot be moved." };
  const [svc, prov] = await Promise.all([appt.serviceId ? scope.byId(service, appt.serviceId) : Promise.resolve(undefined), scope.byId(provider, appt.providerId)]);
  const duration = svc?.durationMin ?? Math.round((appt.endsAt.getTime() - appt.startsAt.getTime()) / 60_000);
  const startsAt = new Date(p.data.startsAt);
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);
  try {
    await scope.transaction(async (sc) => {
      const busy = await getBusy(sc, subDays(startsAt, 1), addDays(startsAt, 1), appt.id);
      if (!prov || !isFree({ id: prov.id, weeklyHours: prov.weeklyHours, exceptions: prov.exceptions }, startsAt, duration, svc?.bufferMin ?? 0, busy, orgRow.timezone)) throw new Error("appointment_no_overlap");
      await sc.update(appointment, appt.id, { startsAt, endsAt });
      await sc.insert(auditEvent, { actorMemberId: null, actorName: "Pet owner", action: "Rescheduled appointment", entityType: "appointment", entityId: appt.id, entityLabel: appt.reference, before: { startsAt: appt.startsAt.toISOString() }, after: { startsAt: startsAt.toISOString() } });
    });
    const emailed = await notifyOwnerOfBooking(scope, orgRow, { ...appt, startsAt, endsAt }, "rescheduled");
    return { ok: true, emailed };
  } catch (e) {
    if (e instanceof Error && /appointment_no_overlap/.test(e.message)) return { ok: false, error: "That slot was just taken. Pick another time.", code: "taken" };
    return { ok: false, error: "The change did not go through. Nothing was saved." };
  }
}
