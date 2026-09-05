import { describe, expect, it } from "vitest";
import { TZDate } from "@date-fns/tz";
import { openSlots, openSlotsForProvider, isFree, utc, type ProviderSchedule } from "./index";

// The seven cases AGENTS.md names, plus the midnight boundary from both sides.
// Every expectation is written in clinic local time and compared as ISO UTC.

const tz = "Asia/Manila";
const monday = new TZDate(2026, 8, 7, 12, 0, tz); // Monday 7 September 2026, noon Manila
const vet: ProviderSchedule = {
  id: "vet",
  weeklyHours: [1, 2, 3, 4, 5, 6].map((day) => ({ day, from: "09:00", to: "12:00" })),
  exceptions: [],
};
const at = (h: number, m = 0) => utc(new TZDate(2026, 8, 7, h, m, tz));
const base = { durationMin: 30, bufferMin: 0, timezone: tz, busy: [] };

describe("availability engine", () => {
  it("offers every slot on a normal day", () => {
    const slots = openSlotsForProvider(vet, monday, base);
    // 09:00 to 12:00 at fifteen minute steps for a thirty minute service: 09:00 ... 11:30
    expect(slots.map((s) => s.startsAt)).toEqual([at(9), at(9, 15), at(9, 30), at(9, 45), at(10), at(10, 15), at(10, 30), at(10, 45), at(11), at(11, 15), at(11, 30)]);
    expect(slots[0].endsAt).toBe(at(9, 30));
  });

  it("offers nothing on a fully booked day", () => {
    const busy = [{ providerId: "vet", startsAt: at(9), endsAt: at(12) }];
    expect(openSlotsForProvider(vet, monday, { ...base, busy })).toEqual([]);
  });

  it("offers only the gaps on a partially booked day", () => {
    const busy = [{ providerId: "vet", startsAt: at(9), endsAt: at(10) }, { providerId: "vet", startsAt: at(11), endsAt: at(12) }];
    const slots = openSlotsForProvider(vet, monday, { ...base, busy }).map((s) => s.startsAt);
    expect(slots).toEqual([at(10), at(10, 15), at(10, 30)]);
  });

  it("keeps the buffer clear on both sides of an existing appointment", () => {
    const busy = [{ providerId: "vet", startsAt: at(10), endsAt: at(10, 30) }];
    const slots = openSlotsForProvider(vet, monday, { ...base, bufferMin: 15, busy }).map((s) => s.startsAt);
    // A 30 min service with 15 min buffer: nothing may end after 09:45 and nothing may start before 10:45.
    expect(slots).toContain(at(9));
    expect(slots).toContain(at(9, 15));
    expect(slots).not.toContain(at(9, 30));
    expect(slots).not.toContain(at(9, 45));
    expect(slots).not.toContain(at(10, 30));
    expect(slots).toContain(at(10, 45));
  });

  it("offers nothing on a closure exception", () => {
    const closed = { ...vet, exceptions: [{ date: "2026-09-07", reason: "Fiesta" }] };
    expect(openSlotsForProvider(closed, monday, base)).toEqual([]);
  });

  it("does not offer a service longer than the remaining window", () => {
    const slots = openSlotsForProvider(vet, monday, { ...base, durationMin: 60 }).map((s) => s.startsAt);
    expect(slots.at(-1)).toBe(at(11));
    expect(slots).not.toContain(at(11, 15));
    expect(openSlotsForProvider(vet, monday, { ...base, durationMin: 200 })).toEqual([]);
  });

  it("keeps the midnight boundary in clinic time, not UTC", () => {
    // 09:00 Manila is 01:00 UTC the same day, and a late evening rule crosses UTC midnight.
    const night: ProviderSchedule = { id: "night", weeklyHours: [{ day: 1, from: "22:00", to: "23:45" }], exceptions: [] };
    const slots = openSlotsForProvider(night, monday, { ...base, durationMin: 45 }).map((s) => s.startsAt);
    expect(slots).toEqual([at(22), at(22, 15), at(22, 30), at(22, 45), at(23)]);
    // Asking for the day by a UTC instant that is still Sunday in UTC but Monday in Manila.
    const mondayEarly = new Date("2026-09-06T17:30:00.000Z"); // 01:30 Monday Manila
    expect(openSlotsForProvider(vet, mondayEarly, base).map((s) => s.startsAt)[0]).toBe(at(9));
  });

  it("respects notBefore so past slots are never offered", () => {
    const slots = openSlotsForProvider(vet, monday, { ...base, notBefore: new TZDate(2026, 8, 7, 10, 20, tz) }).map((s) => s.startsAt);
    expect(slots[0]).toBe(at(10, 30));
  });

  it("merges providers for any available, first free wins", () => {
    const groomer: ProviderSchedule = { id: "groomer", weeklyHours: [{ day: 1, from: "11:30", to: "13:00" }], exceptions: [] };
    const byDay = openSlots({ providers: [vet, groomer], busy: [{ providerId: "vet", startsAt: at(9), endsAt: at(11, 30) }], durationMin: 30, bufferMin: 0, from: monday, days: 1, timezone: tz });
    const day = byDay["2026-09-07"];
    expect(day.find((s) => s.startsAt === at(11, 30))?.providerId).toBe("vet");
    expect(day.find((s) => s.startsAt === at(12))?.providerId).toBe("groomer");
    expect(day.find((s) => s.startsAt === at(9))).toBeUndefined();
  });

  it("answers isFree the same way the slot list does", () => {
    const busy = [{ providerId: "vet", startsAt: at(10), endsAt: at(10, 30) }];
    expect(isFree(vet, new TZDate(2026, 8, 7, 10, 0, tz), 30, 0, busy, tz)).toBe(false);
    expect(isFree(vet, new TZDate(2026, 8, 7, 10, 30, tz), 30, 0, busy, tz)).toBe(true);
    expect(isFree(vet, new TZDate(2026, 8, 7, 11, 45, tz), 30, 0, busy, tz)).toBe(false);
  });
});
