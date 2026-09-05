import { TZDate } from "@date-fns/tz";
import { format, isSameDay, differenceInCalendarDays } from "date-fns";

// Every timestamp is stored as UTC ISO. Everything the person sees is clinic
// local time with the zone labelled, because someone booking from abroad still
// has to arrive at nine in the morning Philippine time. No raw Date arithmetic
// anywhere near scheduling: everything goes through date-fns on a TZDate.

export const DEFAULT_TZ = "Asia/Manila";

const zoneLabels: Record<string, string> = {
  "Asia/Manila": "PHT",
};

export function zoneLabel(tz: string = DEFAULT_TZ): string {
  return zoneLabels[tz] ?? tz;
}

export function inZone(iso: string | Date, tz: string = DEFAULT_TZ): TZDate {
  return new TZDate(typeof iso === "string" ? new Date(iso) : iso, tz);
}

export function clinicNow(tz: string = DEFAULT_TZ): TZDate {
  return TZDate.tz(tz);
}

/** "9:30 AM" */
export function formatTime(iso: string | Date, tz?: string): string {
  return format(inZone(iso, tz), "h:mm a");
}

/** "9:30 AM PHT" */
export function formatTimeWithZone(iso: string | Date, tz: string = DEFAULT_TZ): string {
  return `${formatTime(iso, tz)} ${zoneLabel(tz)}`;
}

/** "Fri 5 Sep" */
export function formatShortDate(iso: string | Date, tz?: string): string {
  return format(inZone(iso, tz), "EEE d MMM");
}

/** "Friday 5 September 2026" */
export function formatLongDate(iso: string | Date, tz?: string): string {
  return format(inZone(iso, tz), "EEEE d MMMM yyyy");
}

/** "5 Sep 2026" */
export function formatDate(iso: string | Date, tz?: string): string {
  return format(inZone(iso, tz), "d MMM yyyy");
}

/** "2026-09-05" in clinic time, the key used to group by day. */
export function dayKey(iso: string | Date, tz?: string): string {
  return format(inZone(iso, tz), "yyyy-MM-dd");
}

/** "Today", "Tomorrow", "Yesterday" or the short date, always followed by the weekday. */
export function relativeDayLabel(iso: string | Date, tz: string = DEFAULT_TZ): string {
  const target = inZone(iso, tz);
  const now = clinicNow(tz);
  const diff = differenceInCalendarDays(target, now);
  const weekday = format(target, "EEEE d MMMM");
  if (isSameDay(target, now)) return `Today, ${weekday}`;
  if (diff === 1) return `Tomorrow, ${weekday}`;
  if (diff === -1) return `Yesterday, ${weekday}`;
  return weekday;
}

/** "in 3 days", "today", "4 days ago" for recall due dates. */
export function dueLabel(isoDate: string, tz: string = DEFAULT_TZ): string {
  const diff = differenceInCalendarDays(inZone(isoDate, tz), clinicNow(tz));
  if (diff === 0) return "due today";
  if (diff === 1) return "due tomorrow";
  if (diff > 1) return `due in ${diff} days`;
  if (diff === -1) return "1 day overdue";
  return `${Math.abs(diff)} days overdue`;
}

export function isOverdue(isoDate: string, tz: string = DEFAULT_TZ): boolean {
  return differenceInCalendarDays(inZone(isoDate, tz), clinicNow(tz)) < 0;
}

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}
