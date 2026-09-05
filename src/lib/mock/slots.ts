import { TZDate } from "@date-fns/tz";
import { addMinutes, isBefore, setHours, setMinutes, startOfDay } from "date-fns";
import type { Appointment, Provider, Service } from "./types";
import { dayKey } from "@/lib/time";

// PROTOTYPE ONLY. A naive open slot list so the slot picker has something to
// render. It is not the availability engine. The engine in src/lib/availability
// (F2a) ships with tests before any real booking is taken and replaces this
// file entirely. Do not extend this; extend the engine.

export interface Slot {
  startsAt: string;
  endsAt: string;
  /** Set when the slot was found across several providers ("any vet"). */
  providerId?: string;
}

/** Open slots across several providers, one entry per start time, first free provider wins. */
export function openSlotsAny(opts: Omit<Parameters<typeof openSlots>[0], "provider"> & { providers: Provider[] }): Slot[] {
  const seen = new Map<string, Slot>();
  for (const provider of opts.providers) {
    for (const s of openSlots({ ...opts, provider })) {
      if (!seen.has(s.startsAt)) seen.set(s.startsAt, { ...s, providerId: provider.id });
    }
  }
  return [...seen.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function openSlots(opts: {
  day: Date;
  tz: string;
  provider: Provider;
  service: Pick<Service, "durationMin" | "bufferMin">;
  appointments: Appointment[];
  /** Nothing before this moment is offered. */
  notBefore?: Date;
}): Slot[] {
  const { day, tz, provider, service, appointments, notBefore } = opts;
  const d = new TZDate(day, tz);
  const rule = provider.weeklyHours.find((r) => r.day === d.getDay());
  if (!rule) return [];
  if (provider.exceptions.some((e) => e.date === dayKey(d, tz))) return [];
  const [fh, fm] = rule.from.split(":").map(Number);
  const [th, tm] = rule.to.split(":").map(Number);
  const open = setMinutes(setHours(startOfDay(d), fh), fm);
  const close = setMinutes(setHours(startOfDay(d), th), tm);
  const busy = appointments
    .filter((a) => a.providerId === provider.id && a.status !== "cancelled" && dayKey(a.startsAt, tz) === dayKey(d, tz))
    .map((a) => ({ s: new Date(a.startsAt).getTime(), e: new Date(a.endsAt).getTime() + service.bufferMin * 60_000 }));
  const out: Slot[] = [];
  for (let t = open; !isBefore(close, addMinutes(t, service.durationMin)); t = addMinutes(t, 15)) {
    const s = t.getTime();
    const e = addMinutes(t, service.durationMin + service.bufferMin).getTime();
    if (notBefore && isBefore(t, notBefore)) continue;
    if (busy.some((b) => s < b.e && e > b.s)) continue;
    out.push({ startsAt: new Date(s).toISOString(), endsAt: addMinutes(t, service.durationMin).toISOString() });
  }
  return out;
}
