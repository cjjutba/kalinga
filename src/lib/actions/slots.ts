"use server";

import { z } from "zod";
import { computeOpenSlots, getOrganisationBySlug } from "@/lib/db/queries";
import { requireMember } from "@/lib/session";
import type { Slot } from "@/lib/availability";

// Open slots are computed on the server and only the open times cross the
// wire. Nobody's appointments leave the database to draw a picker.

const input = z.object({
  orgSlug: z.string().min(1),
  serviceId: z.string().min(1),
  providerId: z.string().min(1),
  from: z.string().datetime({ offset: true }),
  days: z.number().int().min(1).max(28),
  excludeAppointmentId: z.string().optional(),
});

export type SlotsByDay = Record<string, Slot[]>;

/** For signed in staff. */
export async function getStaffSlots(raw: unknown): Promise<SlotsByDay> {
  const p = input.parse(raw);
  const actor = await requireMember(p.orgSlug);
  const orgRow = await getOrganisationBySlug(actor.org.slug);
  if (!orgRow) return {};
  return computeOpenSlots(orgRow, { serviceId: p.serviceId, providerId: p.providerId, from: new Date(p.from), days: p.days, excludeAppointmentId: p.excludeAppointmentId });
}

/** For the public booking page. Only bookable services are offered. */
export async function getPublicSlots(raw: unknown): Promise<SlotsByDay> {
  const p = input.parse(raw);
  const orgRow = await getOrganisationBySlug(p.orgSlug);
  if (!orgRow) return {};
  return computeOpenSlots(orgRow, { serviceId: p.serviceId, providerId: p.providerId, from: new Date(p.from), days: p.days, excludeAppointmentId: p.excludeAppointmentId });
}
