import type { RecallKind } from "@/lib/domain/types";

// The five rendered messages. Nothing is sent in v1. Staff copy the text and
// send it through whatever channel they already use with that client, so the
// wording is short, plain and pasteable into Messenger or a text.

export interface ReminderContext {
  petName: string;
  ownerName: string;
  clinicName: string;
  /** ISO date. */
  dueOn: string;
  bookingUrl: string;
}

export interface BookingContext {
  petName: string;
  ownerName: string;
  clinicName: string;
  serviceName: string;
  /** Already formatted in clinic time with the zone, e.g. "Fri 5 Sep, 9:30 AM PHT". */
  when: string;
  reference: string;
  manageUrl: string;
}

function niceDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[m - 1]}`;
}

export const reminderTitles: Record<RecallKind, string> = {
  vaccination: "Vaccination due",
  deworming: "Deworming due",
  grooming: "Grooming due",
};

export function renderReminder(kind: RecallKind, c: ReminderContext): string {
  const date = niceDate(c.dueOn);
  switch (kind) {
    case "vaccination":
      return `Hi ${c.ownerName}, this is ${c.clinicName}. ${c.petName}'s annual vaccination is due on ${date}. Book a slot at ${c.bookingUrl} or reply here and we'll fit you in.`;
    case "deworming":
      return `Hi ${c.ownerName}, ${c.clinicName} here. ${c.petName} is due for deworming around ${date}. It takes fifteen minutes. Book at ${c.bookingUrl} or reply and we'll sort it out.`;
    case "grooming":
      return `Hi ${c.ownerName}, it's ${c.clinicName}. ${c.petName} is about due for a groom, around ${date}. Book at ${c.bookingUrl} or reply here.`;
  }
}

export function renderBookingConfirmation(c: BookingContext): string {
  return `Hi ${c.ownerName}, ${c.petName} is booked for ${c.serviceName} at ${c.clinicName} on ${c.when}. Your reference is ${c.reference}. Change or cancel at ${c.manageUrl}.`;
}

export function renderBookingChanged(c: BookingContext, kind: "cancelled" | "rescheduled"): string {
  if (kind === "cancelled") {
    return `Hi ${c.ownerName}, ${c.petName}'s ${c.serviceName} at ${c.clinicName} has been cancelled. Reference ${c.reference}. Book again any time at ${c.manageUrl.replace(/\/b\/[^/]+$/, "")}.`;
  }
  return `Hi ${c.ownerName}, ${c.petName}'s ${c.serviceName} at ${c.clinicName} has moved to ${c.when}. Reference ${c.reference}. Change or cancel at ${c.manageUrl}.`;
}

export const templateCatalogue = [
  { id: "booking_confirmation", name: "Booking confirmation", when: "After a booking is made, shown on the confirmation page" },
  { id: "booking_changed", name: "Cancellation and reschedule", when: "After a booking is cancelled or moved" },
  { id: "vaccination", name: "Vaccination due", when: "A year after the last dose" },
  { id: "deworming", name: "Deworming due", when: "Three months after the last dose" },
  { id: "grooming", name: "Grooming due", when: "On the clinic's grooming interval, five weeks by default" },
] as const;
