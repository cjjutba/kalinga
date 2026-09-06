import type { Scope } from "@/lib/db/scoped";
import { owner, pet, service } from "@/lib/db/schema";
import type * as Row from "@/lib/db/types";
import { renderBookingChanged, renderBookingConfirmation } from "@/content/templates";
import { sendBookingEmail } from "@/lib/email";
import { formatShortDate, formatTime, zoneLabel } from "@/lib/time";
import { firstName } from "@/lib/domain/selectors";

// Tells the pet owner what just happened to their booking, by email, when they
// gave one and Resend is connected. The words are the same ones the
// confirmation page shows. This never fails the booking: a mail problem is
// logged and the caller learns only that nothing was emailed.

export type BookingNotice = "confirmed" | "cancelled" | "rescheduled";

export async function notifyOwnerOfBooking(scope: Scope, org: Row.Organisation, appt: Row.Appointment, kind: BookingNotice): Promise<boolean> {
  const o = await scope.byId(owner, appt.ownerId);
  if (!o?.email) return false;
  const [p, svc] = await Promise.all([scope.byId(pet, appt.petId), appt.serviceId ? scope.byId(service, appt.serviceId) : Promise.resolve(undefined)]);
  const tz = org.timezone;
  const startsAt = appt.startsAt.toISOString();
  const ctx = {
    petName: p?.name ?? "Your pet",
    ownerName: firstName(o.name),
    clinicName: org.name,
    serviceName: svc?.name ?? "visit",
    when: `${formatShortDate(startsAt, tz)}, ${formatTime(startsAt, tz)} ${zoneLabel(tz)}`,
    reference: appt.reference,
    manageUrl: `kalinga.cjjutba.dev/${org.slug}/b/${appt.reference}`,
  };
  const text = kind === "confirmed" ? renderBookingConfirmation(ctx) : renderBookingChanged(ctx, kind);
  const subject =
    kind === "confirmed" ? `${ctx.petName} is booked at ${org.name}, ${ctx.when}` : kind === "rescheduled" ? `${ctx.petName}'s appointment at ${org.name} has moved` : `${ctx.petName}'s appointment at ${org.name} is cancelled`;
  // A cancelled booking has nothing left to manage, so its button offers the
  // clinic's page instead of the reference.
  const action =
    kind === "cancelled"
      ? { url: `https://kalinga.cjjutba.dev/${org.slug}`, label: "Book another time" }
      : { url: `https://${ctx.manageUrl}`, label: "Change or cancel this booking" };
  try {
    const r = await sendBookingEmail({ to: o.email, subject, text, manageUrl: action.url, actionLabel: action.label, clinicName: org.name });
    return r.sent;
  } catch (e) {
    console.error(`[booking email failed] to=${o.email} reference=${appt.reference}`, e instanceof Error ? e.message : e);
    return false;
  }
}
