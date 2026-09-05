"use client";

import { useMemo, useState } from "react";
import { TZDate } from "@date-fns/tz";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment, Provider, Service } from "@/lib/mock/types";
import { openSlots, type Slot } from "@/lib/mock/slots";
import { clinicNow, formatTime, formatShortDate, zoneLabel } from "@/lib/time";
import { cn } from "@/lib/utils";

// The screen that decides the quality of the whole product. A date strip with
// the selected day filled, a two column grid of slot tiles, an honest message
// when a day is full with the next open slot offered, and never an apology.
// Runs on fixture slots in the prototype. The availability engine replaces
// the source in F2a; this component stays.

export function SlotPicker({
  tz,
  provider,
  service,
  appointments,
  value,
  onChange,
  excludeAppointmentId,
  days = 7,
  startDay,
  compact = false,
}: {
  tz: string;
  provider: Provider;
  service: Pick<Service, "durationMin" | "bufferMin">;
  appointments: Appointment[];
  value: Slot | null;
  onChange: (slot: Slot) => void;
  excludeAppointmentId?: string;
  days?: number;
  startDay?: Date;
  compact?: boolean;
}) {
  const today = useMemo(() => startOfDay(startDay ? new TZDate(startDay, tz) : clinicNow(tz)) as TZDate, [startDay, tz]);
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState<TZDate>(() => (value ? (startOfDay(new TZDate(new Date(value.startsAt), tz)) as TZDate) : today));
  const relevant = useMemo(() => appointments.filter((a) => a.id !== excludeAppointmentId), [appointments, excludeAppointmentId]);
  const now = clinicNow(tz);

  const strip = useMemo(() => Array.from({ length: days }, (_, i) => addDays(today, offset + i) as TZDate), [today, offset, days]);
  const slotsFor = (d: Date) => openSlots({ day: d, tz, provider, service, appointments: relevant, notBefore: now });
  const slots = useMemo(() => slotsFor(day), [day, tz, provider, service, relevant]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextOpen = useMemo(() => {
    for (let i = 1; i <= 21; i++) {
      const d = addDays(day, i) as TZDate;
      const s = slotsFor(d);
      if (s.length) return { day: d, slot: s[0] };
    }
    return null;
  }, [day, tz, provider, service, relevant]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - days))}
          disabled={offset === 0}
          aria-label="Earlier days"
          className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-field disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <div role="radiogroup" aria-label="Day" className="flex flex-1 gap-1.5 overflow-x-auto py-1 [scrollbar-width:none]">
          {strip.map((d) => {
            const selected = isSameDay(d, day);
            const open = slotsFor(d).length > 0;
            return (
              <button
                key={d.toISOString()}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDay(d)}
                className={cn(
                  "flex min-w-[52px] flex-1 flex-col items-center rounded-input py-2 text-label transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
                  selected ? "bg-action text-on-action" : "bg-field text-text hover:bg-divider",
                  !open && !selected && "text-text-3",
                )}
              >
                <span className="font-medium">{format(d, "EEE")}</span>
                <span className="text-body tabular">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOffset((o) => o + days)}
          aria-label="Later days"
          className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-small font-medium">{formatShortDate(day, tz)}</p>
        <p className="text-label text-text-2">
          Times in {zoneLabel(tz)}. {provider.name.replace(/^Dr\.\s*/, "Dr. ")}
        </p>
      </div>

      {slots.length ? (
        <div role="radiogroup" aria-label="Time" className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
          {slots.map((s) => {
            const selected = value?.startsAt === s.startsAt;
            return (
              <button
                key={s.startsAt}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(s)}
                className={cn(
                  "h-12 rounded-input text-body tabular transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
                  selected ? "bg-action text-on-action" : "bg-field text-text hover:bg-divider",
                )}
              >
                {formatTime(s.startsAt, tz)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-guide bg-field p-4">
          <p className="text-body font-medium">Every slot on {formatShortDate(day, tz)} is taken</p>
          {nextOpen ? (
            <>
              <p className="mt-1 text-small text-text-2">
                The next open slot is {formatShortDate(nextOpen.day, tz)} at {formatTime(nextOpen.slot.startsAt, tz)}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDay(nextOpen.day);
                  onChange(nextOpen.slot);
                }}
                className="mt-3 h-10 rounded-full bg-action px-4 text-small font-medium text-on-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                Take {formatShortDate(nextOpen.day, tz)}, {formatTime(nextOpen.slot.startsAt, tz)}
              </button>
            </>
          ) : (
            <p className="mt-1 text-small text-text-2">Nothing is open in the next three weeks with this vet. Try another vet, or call the clinic.</p>
          )}
        </div>
      )}
    </div>
  );
}
