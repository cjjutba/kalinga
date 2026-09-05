"use client";

import { useEffect, useMemo, useState } from "react";
import { TZDate } from "@date-fns/tz";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slot } from "@/lib/availability";
import type { SlotsByDay } from "@/lib/actions/slots";
import { clinicNow, formatTime, formatShortDate, zoneLabel } from "@/lib/time";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// The screen that decides the quality of the whole product. A date strip with
// the selected day filled, a grid of slot tiles, an honest message when a day
// is full with the next open slot offered, and never an apology. Slots come
// from the server through `load`, three weeks at a time, so nobody's
// appointments leave the database to draw this.

export type { Slot };

const DAYS = 7;
const WINDOW = 21;

export function SlotPicker({
  tz,
  load,
  value,
  onChange,
  who,
  compact = false,
  startDay,
  reloadKey,
}: {
  tz: string;
  /** Returns open slots keyed by clinic day for `days` days from `from`. */
  load: (from: Date, days: number) => Promise<SlotsByDay>;
  value: Slot | null;
  onChange: (slot: Slot) => void;
  /** Shown under the strip, e.g. the vet's name or "Any available vet". */
  who: string;
  compact?: boolean;
  startDay?: Date;
  /** Change to force a reload, e.g. when the service or vet changes. */
  reloadKey?: string;
}) {
  const today = useMemo(() => startOfDay(startDay ? new TZDate(startDay, tz) : clinicNow(tz)) as TZDate, [startDay, tz]);
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState<TZDate>(() => (value ? (startOfDay(new TZDate(new Date(value.startsAt), tz)) as TZDate) : today));
  const [loaded, setLoaded] = useState<{ key: string; data: SlotsByDay | null; error: string | null } | null>(null);
  const windowStart = useMemo(() => addDays(today, Math.floor(offset / WINDOW) * WINDOW) as TZDate, [today, offset]);
  const requestKey = `${windowStart.toISOString()}|${reloadKey ?? ""}`;

  useEffect(() => {
    let cancelled = false;
    load(windowStart, WINDOW)
      .then((data) => {
        if (!cancelled) setLoaded({ key: requestKey, data, error: null });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, data: null, error: "Check your connection and try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [load, windowStart, requestKey]);

  const current = loaded?.key === requestKey ? loaded : null;
  const byDay = current?.data ?? null;
  const error = current?.error ?? null;

  const strip = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(today, offset + i) as TZDate), [today, offset]);
  const slotsFor = (d: Date) => byDay?.[format(new TZDate(d, tz), "yyyy-MM-dd")] ?? [];
  const slots = slotsFor(day);
  // Cheap enough to recompute: at most twenty one lookups.
  let nextOpen: { day: TZDate; slot: Slot } | null = null;
  if (byDay) {
    for (let i = 1; i <= WINDOW && !nextOpen; i++) {
      const d = addDays(day, i) as TZDate;
      const s = byDay[format(d, "yyyy-MM-dd")];
      if (s?.length) nextOpen = { day: d, slot: s[0] };
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOffset((o) => Math.max(0, o - DAYS))} disabled={offset === 0} aria-label="Earlier days" className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-field disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
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
                  byDay && !open && !selected && "text-text-2",
                )}
              >
                <span className="font-medium">{format(d, "EEE")}</span>
                <span className="text-body tabular">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => setOffset((o) => o + DAYS)} aria-label="Later days" className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-small font-medium">{formatShortDate(day, tz)}</p>
        <p className="text-label text-text-2">
          Times in {zoneLabel(tz)}. {who}
        </p>
      </div>

      {error ? (
        <div role="alert" className="rounded-guide bg-field p-4">
          <p className="text-body font-medium">Could not load open times</p>
          <p className="mt-1 text-small text-text-2">{error}</p>
        </div>
      ) : !byDay ? (
        <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")} aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-input bg-field" />
          ))}
        </div>
      ) : slots.length ? (
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
          <p className="text-body font-medium">Nothing open on {formatShortDate(day, tz)}</p>
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
            <p className="mt-1 text-small text-text-2">Nothing is open in the next three weeks. Try later days, another vet, or call the clinic.</p>
          )}
        </div>
      )}
    </div>
  );
}
