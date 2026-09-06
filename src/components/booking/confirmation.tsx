"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, X } from "lucide-react";
import { SlotPicker, type Slot } from "./slot-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/primitives/pill";
import { Celebrate } from "./celebrate";
import { PublicFooter } from "./public-footer";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import type { getBookingByReference } from "@/lib/db/queries";
import { getPublicSlots } from "@/lib/actions/slots";
import { cancelBooking, rescheduleBooking } from "@/lib/actions/public";
import { renderBookingChanged, renderBookingConfirmation } from "@/content/templates";
import { formatLongDate, formatPeso, formatShortDate, formatTimeWithZone } from "@/lib/time";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/domain/selectors";

type Booking = NonNullable<Awaited<ReturnType<typeof getBookingByReference>>>;

// Confirmation and manage booking on one page, because the link in the
// message is the same link. The confirmation text is shown here, ready to
// copy, and the owner can move or cancel their own booking. The reference is
// the key: it is long enough to guess badly and short enough to read aloud.

export function BookingConfirmation({ data, emailedOnBooking = false, justBooked = false }: { data: Booking; emailedOnBooking?: boolean; /** Arrived here straight from booking, rather than through the link later. */ justBooked?: boolean }) {
  const router = useRouter();
  const { organisation: org, appointment: appt, pet, owner, service, provider } = data;
  const tz = org.timezone;
  const [copied, setCopied] = useState(false);
  const [moving, setMoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState<"cancelled" | "rescheduled" | null>(null);
  const [emailed, setEmailed] = useState(emailedOnBooking);

  const load = useCallback((from: Date, days: number) => getPublicSlots({ orgSlug: org.slug, serviceId: appt.serviceId ?? "", providerId: appt.providerId, from: from.toISOString(), days, excludeAppointmentId: appt.id }), [org.slug, appt.serviceId, appt.providerId, appt.id]);

  const ctx = {
    petName: pet?.name ?? "your pet",
    ownerName: owner ? firstName(owner.name) : "there",
    clinicName: org.name,
    serviceName: service?.name ?? "your visit",
    when: `${formatShortDate(appt.startsAt, tz)}, ${formatTimeWithZone(appt.startsAt, tz)}`,
    reference: appt.reference,
    manageUrl: `kalinga.cjjutba.dev/${org.slug}/b/${appt.reference}`,
  };
  const message = changed ? renderBookingChanged(ctx, changed) : renderBookingConfirmation(ctx);
  const past = new Date(appt.startsAt) < new Date();
  const canChange = !past && appt.status !== "cancelled" && appt.status !== "completed";

  async function move() {
    if (!slot) return;
    setBusy(true);
    setError(null);
    const r = await rescheduleBooking({ orgSlug: org.slug, reference: appt.reference, startsAt: slot.startsAt });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Could not move the booking.");
      setSlot(null);
      return;
    }
    setChanged("rescheduled");
    setEmailed(Boolean(r.emailed));
    setMoving(false);
    setSlot(null);
    router.refresh();
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    const r = await cancelBooking({ orgSlug: org.slug, reference: appt.reference });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Could not cancel the booking.");
      return;
    }
    setChanged("cancelled");
    setEmailed(Boolean(r.emailed));
    setCancelling(false);
    router.refresh();
  }

  const cancelled = changed === "cancelled" || appt.status === "cancelled";
  const heading = cancelled ? "This booking is cancelled" : changed === "rescheduled" ? "Your booking has moved" : appt.status === "completed" ? "This visit has happened" : "You're booked";
  const lead = cancelled
    ? "The slot is open again. Book another time whenever you are ready."
    : emailed && owner?.email
      ? `A copy has gone to ${owner.email}. Keep this page, it is how you change or cancel.`
      : "Keep this page, it is how you change or cancel.";

  return (
    // The same panel the booking flow ends in, without the rail, so the last
    // screen belongs to the same product as the five before it. Three parts,
    // hairline between each: that it worked, what was booked with the day and
    // time leading, and how to change it.
    <div className="flex min-h-dvh flex-col bg-page">
      <Celebrate active={justBooked && !cancelled} />
      <div className="flex flex-1 justify-center px-4 py-8 md:items-center md:px-6 md:py-10">
        <main className="w-full max-w-step md:rounded-card md:border md:border-divider md:p-8">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn("grid size-11 place-items-center rounded-full", cancelled ? "bg-field text-text-2" : "bg-action text-on-action")}
              aria-hidden
            >
              {cancelled ? <X className="size-5" strokeWidth={2} /> : <Check className="size-5" strokeWidth={2} />}
            </span>
            {/* The check and the heading already say "booked". The pill is
                for the states they do not cover. */}
            {appt.status === "booked" || appt.status === "confirmed" ? null : <StatusPill status={appt.status} />}
          </div>

          <h1 className="mt-5 text-title font-medium text-balance">{heading}</h1>
          <p className="mt-1.5 text-small text-text-2">{lead}</p>

          <div className="mt-6 border-t border-divider pt-6">
            <p className="text-heading font-medium tabular">{formatLongDate(appt.startsAt, tz)}</p>
            <p className="mt-0.5 text-body tabular text-text-2">{formatTimeWithZone(appt.startsAt, tz)}</p>

            <dl className="mt-5 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-small">
              <dt className="text-text-2">What</dt>
              <dd>
                {service?.name ?? "Visit"}
                {service ? `, ${formatPeso(service.pricePhp)}` : ""}
              </dd>
              <dt className="text-text-2">With</dt>
              <dd>{provider?.name}</dd>
              <dt className="text-text-2">For</dt>
              <dd>{pet?.name}</dd>
              {org.address ? (
                <>
                  <dt className="text-text-2">Where</dt>
                  <dd>{org.address}</dd>
                </>
              ) : null}
              <dt className="text-text-2">Reference</dt>
              <dd className="tabular font-medium">{appt.reference}</dd>
            </dl>
          </div>

          {error ? (
            <p role="alert" className="mt-5 text-small text-error">
              {error}
            </p>
          ) : null}

          {canChange ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-divider pt-6">
              <Pill size="sm" variant="secondary" onClick={() => setMoving(true)}>
                Change the time
              </Pill>
              <Pill size="sm" variant="text" onClick={() => setCancelling(true)}>
                Cancel this booking
              </Pill>
            </div>
          ) : cancelled ? (
            <div className="mt-6 border-t border-divider pt-6">
              <Pill asChild size="sm">
                <Link href={`/${org.slug}/book`}>Book another time</Link>
              </Pill>
            </div>
          ) : null}
        </main>
      </div>

      {/* The message the clinic would have sent by hand, for anyone who wants
          to forward it. Quieter than the booking itself, so it sits under the
          panel rather than in it. */}
      <div className="mx-auto w-full max-w-step px-4 pb-10 pt-8 md:px-6 md:pt-6">
        <section aria-labelledby="msg">
          <h2 id="msg" className="text-label font-medium text-text-2">
            Your confirmation
          </h2>
          <blockquote className="mt-2 rounded-guide bg-sheet p-4 text-small leading-[1.5]">{message}</blockquote>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Pill
              size="xs"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check className="size-3.5" strokeWidth={2} aria-hidden /> : <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />}
              {copied ? "Copied" : "Copy message"}
            </Pill>
            <p className="text-label text-text-2">
              Want to see your pets and past visits?{" "}
              <Link href="/me" className="font-medium text-text hover:underline">
                Open your Kalinga
              </Link>
            </p>
          </div>
        </section>
      </div>

      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-lg overflow-y-auto rounded-sheet border-0 bg-sheet p-6 shadow-lifted">
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">Pick a new time</DialogTitle>
            <DialogDescription className="text-small text-text-2">With {provider?.name}. Your current slot opens up for someone else.</DialogDescription>
          </DialogHeader>
          {appt.serviceId ? (
            <div className="mt-4">
              <SlotPicker tz={tz} load={load} value={slot} onChange={setSlot} who={provider?.name ?? ""} compact />
            </div>
          ) : (
            <p className="mt-4 text-small text-text-2">This booking has no service attached. Call the clinic to move it.</p>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Pill size="sm" variant="secondary" onClick={() => setMoving(false)}>
              Keep my time
            </Pill>
            <Pill size="sm" disabled={!slot} loading={busy} loadingLabel="Moving" onClick={move}>
              {slot ? `Move to ${formatShortDate(slot.startsAt, tz)}, ${formatTimeWithZone(slot.startsAt, tz)}` : "Pick a time"}
            </Pill>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelling} onOpenChange={setCancelling}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-md rounded-sheet border-0 bg-sheet p-6 shadow-lifted">
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">Cancel this booking?</DialogTitle>
            <DialogDescription className="text-small text-text-2">The clinic will see it straight away. You can book again any time.</DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Pill size="sm" variant="secondary" onClick={() => setCancelling(false)}>
              Keep it
            </Pill>
            <Pill size="sm" variant="danger" loading={busy} loadingLabel="Cancelling" onClick={cancel}>
              Cancel booking
            </Pill>
          </div>
        </DialogContent>
      </Dialog>

      <PublicFooter />
    </div>
  );
}
