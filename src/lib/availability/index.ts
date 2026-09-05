import { TZDate } from "@date-fns/tz";
import { addDays, addMinutes, format, isBefore, setHours, setMinutes, startOfDay } from "date-fns";

// The availability engine. Pure: no database, no React, no Next. Given
// working hours, exceptions, existing appointments, a service duration and
// buffer, a date range and a timezone, it returns open slots. Everything is
// computed in clinic local time on a TZDate, and no raw Date arithmetic
// happens here. This is the only part of the product where correctness is
// subtle, and the failure mode is double booking a real customer, so the
// tests in engine.test.ts run before any screen consumes it.

export interface WeeklyRule {
  /** 0 is Sunday, as Date.getDay(). */
  day: number;
  /** "HH:mm" in clinic local time. */
  from: string;
  to: string;
}

export interface ClosedDay {
  /** "yyyy-MM-dd" in clinic local time. */
  date: string;
  reason?: string;
}

export interface Busy {
  /** ISO timestamps, UTC. */
  startsAt: string;
  endsAt: string;
  providerId: string;
}

export interface ProviderSchedule {
  id: string;
  weeklyHours: WeeklyRule[];
  exceptions: ClosedDay[];
}

export interface EngineInput {
  providers: ProviderSchedule[];
  busy: Busy[];
  durationMin: number;
  bufferMin: number;
  /** First day to consider, any instant on that day. */
  from: Date;
  /** Number of days from `from` to consider, inclusive of the first. */
  days: number;
  timezone: string;
  /** Slots starting before this instant are not offered. */
  notBefore?: Date;
  /** Slot granularity in minutes. Fixed at fifteen in v1. */
  stepMin?: number;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  providerId: string;
}

export const STEP_MIN = 15;

/** ISO in UTC with a Z. A TZDate prints its offset, which is not what the database or the client compares. */
export const utc = (d: Date): string => new Date(d.getTime()).toISOString();

function timeOn(day: TZDate, hhmm: string): TZDate {
  const [h, m] = hhmm.split(":").map(Number);
  return setMinutes(setHours(startOfDay(day), h), m) as TZDate;
}

export function dayKey(d: Date, timezone: string): string {
  return format(new TZDate(d, timezone), "yyyy-MM-dd");
}

/**
 * Open slots for one provider on one day. Buffer extends both the new slot and
 * every existing appointment, so two bookings never sit closer than the
 * buffer allows.
 */
export function openSlotsForProvider(provider: ProviderSchedule, day: Date, input: Omit<EngineInput, "providers" | "from" | "days">): Slot[] {
  const step = input.stepMin ?? STEP_MIN;
  const tzDay = startOfDay(new TZDate(day, input.timezone)) as TZDate;
  const key = format(tzDay, "yyyy-MM-dd");
  if (provider.exceptions.some((e) => e.date === key)) return [];
  const rules = provider.weeklyHours.filter((r) => r.day === tzDay.getDay());
  if (!rules.length) return [];

  const buffer = input.bufferMin;
  const busy = input.busy
    .filter((b) => b.providerId === provider.id)
    .map((b) => ({ s: new Date(b.startsAt).getTime(), e: addMinutes(new Date(b.endsAt), buffer).getTime() }));

  const out: Slot[] = [];
  for (const rule of rules) {
    const open = timeOn(tzDay, rule.from);
    const close = timeOn(tzDay, rule.to);
    for (let t: Date = open; !isBefore(close, addMinutes(t, input.durationMin)); t = addMinutes(t, step)) {
      if (input.notBefore && isBefore(t, input.notBefore)) continue;
      const s = t.getTime();
      const e = addMinutes(t, input.durationMin + buffer).getTime();
      if (busy.some((b) => s < b.e && e > b.s)) continue;
      out.push({ startsAt: utc(t), endsAt: utc(addMinutes(t, input.durationMin)), providerId: provider.id });
    }
  }
  return out;
}

/** Open slots across providers, keyed by clinic local day. Any provider: first free one wins each start time. */
export function openSlots(input: EngineInput): Record<string, Slot[]> {
  const result: Record<string, Slot[]> = {};
  const first = startOfDay(new TZDate(input.from, input.timezone)) as TZDate;
  for (let i = 0; i < input.days; i++) {
    const day = addDays(first, i) as TZDate;
    const seen = new Map<string, Slot>();
    for (const provider of input.providers) {
      for (const slot of openSlotsForProvider(provider, day, input)) {
        if (!seen.has(slot.startsAt)) seen.set(slot.startsAt, slot);
      }
    }
    result[format(day, "yyyy-MM-dd")] = [...seen.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return result;
}

/** True when the requested range is free for the provider, buffer included. The server checks this inside the booking transaction, and the database exclusion constraint checks it again. */
export function isFree(provider: ProviderSchedule, startsAt: Date, durationMin: number, bufferMin: number, busy: Busy[], timezone: string): boolean {
  const slots = openSlotsForProvider(provider, startsAt, { busy, durationMin, bufferMin, timezone });
  const iso = utc(startsAt);
  return slots.some((s) => s.startsAt === iso);
}
