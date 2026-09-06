import { TZDate } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { Appointment, Owner, Pet, Provider, Service } from "./types";
import { dayKey, inZone, clinicNow } from "@/lib/time";

// Joins and groupings the screens need, kept out of components so the same
// shape can be served by real queries later.

export interface AppointmentRow {
  appointment: Appointment;
  pet: Pet | undefined;
  owner: Owner | undefined;
  service: Service | undefined;
  provider: Provider | undefined;
}

export function joinAppointment(f: { pets: Pet[]; owners: Owner[]; services: Service[]; providers: Provider[] }, a: Appointment): AppointmentRow {
  return {
    appointment: a,
    pet: f.pets.find((p) => p.id === a.petId),
    owner: f.owners.find((o) => o.id === a.ownerId),
    service: a.serviceId ? f.services.find((s) => s.id === a.serviceId) : undefined,
    provider: f.providers.find((p) => p.id === a.providerId),
  };
}

export function appointmentsOn(appointments: Appointment[], day: Date, tz: string): Appointment[] {
  const key = dayKey(day, tz);
  return appointments.filter((a) => dayKey(a.startsAt, tz) === key).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Today if it has appointments, otherwise the next day that does. Never an empty day by default. */
export function defaultDay(appointments: Appointment[], tz: string): TZDate {
  const today = startOfDay(clinicNow(tz)) as TZDate;
  for (let i = 0; i < 60; i++) {
    const d = addDays(today, i) as TZDate;
    if (appointmentsOn(appointments, d, tz).length) return d;
  }
  return today;
}

export function daysWithAppointments(appointments: Appointment[], tz: string): Set<string> {
  return new Set(appointments.map((a) => dayKey(a.startsAt, tz)));
}

export function ageLabel(birthDate: string, tz: string): string {
  if (!birthDate) return "age not recorded";
  const days = differenceInCalendarDays(clinicNow(tz), inZone(birthDate, tz));
  if (Number.isNaN(days)) return "age not recorded";
  if (days < 60) return `${Math.max(1, Math.round(days / 7))} wk`;
  const months = Math.floor(days / 30.4);
  if (months < 24) return `${months} mo`;
  return `${Math.floor(days / 365.25)} yr`;
}

/** The name a message greets someone by. Skips "Dr." so a vet is not addressed as "Dr.". */
export function firstName(name: string): string {
  return name.replace(/^Dr\.\s*/, "").split(/\s+/)[0] || name;
}

export function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function petLabel(pet?: Pet): string {
  if (!pet) return "Pet";
  return `${pet.name}, ${pet.breed}`;
}

export const speciesLabel = { dog: "Dog", cat: "Cat" } as const;
