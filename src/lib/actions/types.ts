import { z } from "zod";

// Every change a staff member can make, as a discriminated union validated
// with zod on the server. The names are the prototype's reducer actions, so
// the screens dispatch exactly what they always did.

const id = z.string().min(1).max(64);
const short = z.string().trim().min(1).max(200);
const longText = z.string().trim().max(4000);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoStamp = z.string().datetime({ offset: true });
const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const role = z.enum(["owner", "vet", "front_desk"]);
const status = z.enum(["booked", "confirmed", "arrived", "completed", "cancelled", "no_show"]);
const recallKind = z.enum(["vaccination", "deworming", "grooming"]);

export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("appointment/status"), id, status, reason: z.string().trim().max(500).optional() }),
  z.object({ type: z.literal("appointment/reschedule"), id, startsAt: isoStamp, endsAt: isoStamp, providerId: id.optional() }),
  z.object({
    type: z.literal("appointment/create"),
    appointment: z.object({
      ownerId: id,
      petId: id,
      serviceId: id.nullable(),
      providerId: id,
      startsAt: isoStamp,
      endsAt: isoStamp,
      status: status.default("booked"),
      source: z.enum(["staff", "walk_in"]),
      note: longText.optional(),
    }),
  }),
  z.object({ type: z.literal("appointment/note"), id, note: longText }),
  z.object({
    type: z.literal("visit/add"),
    visit: z.object({
      appointmentId: id,
      petId: id,
      providerId: id,
      at: isoStamp.optional(),
      weightKg: z.number().positive().max(300).optional(),
      notes: longText.min(1),
      administered: z.array(short).max(20).default([]),
      paymentMethod: z.enum(["cash", "gcash"]).optional(),
      paymentRef: z.string().trim().max(64).optional(),
    }),
  }),
  z.object({
    type: z.literal("owner/upsert"),
    owner: z.object({ id: id.optional(), name: short, mobile: z.string().trim().max(32).optional(), email: z.string().trim().email().max(200).optional(), notes: longText.optional() }),
  }),
  z.object({
    type: z.literal("pet/upsert"),
    pet: z.object({
      id: id.optional(),
      ownerId: id,
      name: short,
      species: z.enum(["dog", "cat"]),
      breed: short,
      sex: z.enum(["male", "female"]),
      birthDate: isoDate.optional(),
      weightKg: z.number().positive().max(300).optional(),
      notes: longText.optional(),
      lastVaccination: isoDate.optional(),
      lastDeworming: isoDate.optional(),
      lastGroom: isoDate.optional(),
    }),
  }),
  z.object({
    type: z.literal("service/upsert"),
    service: z.object({
      id: id.optional(),
      name: short,
      durationMin: z.number().int().min(5).max(480),
      bufferMin: z.number().int().min(0).max(120),
      pricePhp: z.number().int().min(0).max(1_000_000),
      publiclyBookable: z.boolean(),
      recallKind: recallKind.optional(),
    }),
  }),
  z.object({ type: z.literal("service/archive"), id }),
  z.object({
    type: z.literal("provider/upsert"),
    provider: z.object({
      id: id.optional(),
      name: short,
      title: z.enum(["Vet", "Groomer"]),
      memberId: id.nullable().optional(),
      weeklyHours: z.array(z.object({ day: z.number().int().min(0).max(6), from: hhmm, to: hhmm })).max(14).optional(),
      exceptions: z.array(z.object({ date: isoDate, reason: z.string().trim().max(200) })).max(400).optional(),
    }),
  }),
  z.object({ type: z.literal("provider/archive"), id }),
  z.object({ type: z.literal("member/invite"), member: z.object({ email: z.string().trim().email().max(200), role }) }),
  z.object({ type: z.literal("member/role"), id, role }),
  z.object({ type: z.literal("member/remove"), id }),
  z.object({ type: z.literal("invitation/cancel"), id }),
  z.object({ type: z.literal("owner/delete"), id, reason: z.string().trim().max(500).optional() }),
  z.object({ type: z.literal("reminder/sent"), id }),
  z.object({ type: z.literal("reminder/email"), id }),
  z.object({ type: z.literal("reminder/unsend"), id }),
  z.object({
    type: z.literal("org/update"),
    changes: z.object({
      name: short.optional(),
      address: z.string().trim().max(300).optional(),
      city: z.string().trim().max(100).optional(),
      mobile: z.string().trim().max(32).optional(),
      email: z.string().trim().email().max(200).or(z.literal("")).optional(),
      timezone: z.string().trim().max(64).optional(),
      openFrom: hhmm.optional(),
      openTo: hhmm.optional(),
      groomingIntervalWeeks: z.number().int().min(2).max(12).optional(),
    }),
  }),
]);

export type StoreAction = z.infer<typeof actionSchema>;

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string };
