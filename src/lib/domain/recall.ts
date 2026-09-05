import { TZDate } from "@date-fns/tz";
import { addMonths, addWeeks, addYears, differenceInCalendarDays } from "date-fns";
import type { Organisation, Pet, RecallKind } from "./types";
import { clinicNow, dayKey } from "@/lib/time";

// The rules that decide what is due. Vaccination annually from the last dose,
// deworming quarterly, grooming on the clinic's interval. Pure, so the recall
// queue and the pet record agree.

export interface DueItem {
  kind: RecallKind;
  last?: string;
  /** ISO date, or undefined when there is no history to count from. */
  dueOn?: string;
  /** Calendar days from today. Negative is overdue. */
  days?: number;
  state: "overdue" | "due" | "upcoming" | "unknown";
}

export const recallLabel: Record<RecallKind, string> = {
  vaccination: "Vaccination",
  deworming: "Deworming",
  grooming: "Grooming",
};

export function dueItems(pet: Pet, org: Organisation): DueItem[] {
  const tz = org.timezone;
  const today = clinicNow(tz);
  const make = (kind: RecallKind, last: string | undefined, next: (d: TZDate) => Date): DueItem => {
    if (!last) return { kind, state: "unknown" };
    const due = next(new TZDate(last, tz));
    const days = differenceInCalendarDays(due, today);
    return { kind, last, dueOn: dayKey(due, tz), days, state: days < 0 ? "overdue" : days <= 14 ? "due" : "upcoming" };
  };
  const items = [
    make("vaccination", pet.lastVaccination, (d) => addYears(d, 1)),
    make("deworming", pet.lastDeworming, (d) => addMonths(d, 3)),
  ];
  if (pet.species === "dog" || pet.lastGroom) items.push(make("grooming", pet.lastGroom, (d) => addWeeks(d, org.groomingIntervalWeeks)));
  return items;
}

export function soonest(items: DueItem[]): DueItem | undefined {
  return items.filter((i) => i.days !== undefined).sort((a, b) => a.days! - b.days!)[0];
}
