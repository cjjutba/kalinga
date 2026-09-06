"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { SlotPicker, type Slot } from "./slot-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/primitives/pill";
import { useConfirm } from "@/components/primitives/confirm";
import { Celebrate } from "./celebrate";
import { PublicFooter } from "./public-footer";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import type { getBookingByReference } from "@/lib/db/queries";
import { getPublicSlots } from "@/lib/actions/slots";
import { cancelBooking, rescheduleBooking } from "@/lib/actions/public";
import { formatLongDate, formatPeso, formatShortDate, formatTimeWithZone } from "@/lib/time";
import { cn } from "@/lib/utils";

type Booking = NonNullable<Awaited<ReturnType<typeof getBookingByReference>>>;

// Confirmation and manage booking on one page, because the link in the email
// is the same link. The owner can move or cancel their own booking from here.
// The reference is the key: long enough to guess badly, short enough to read
// aloud down the phone.
//
// The rendered message that used to sit here has gone. It was written for a
// product that sent nothing, so the desk copied it by hand. The clinic's queue
// still works that way and still has it. A pet owner looking at their own
// booking has the booking in front of them and a copy in their inbox.

export function BookingConfirmation({ data, emailedOnBooking = false, justBooked = false }: { data: Booking; emailedOnBooking?: boolean; /** Arrived here straight from booking, rather than through the link later. */ justBooked?: boolean }) {
  const router = useRouter();
  const { organisation: org, appointment: appt, pet, owner, service, provider } = data;
  const tz = org.timezone;
  const [moving, setMoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const confirm = useConfirm();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState<"cancelled" | "rescheduled" | null>(null);
  const [emailed, setEmailed] = useState(emailedOnBooking);

  const load = useCallback((from: Date, days: number) => getPublicSlots({ orgSlug: org.slug, serviceId: appt.serviceId ?? "", providerId: appt.providerId, from: from.toISOString(), days, excludeAppointmentId: appt.id }), [org.slug, appt.serviceId, appt.providerId, appt.id]);

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
    const sure = await confirm({
      title: "Cancel this booking?",
      description: "The clinic sees it straight away and the slot opens up for someone else. You can book again any time.",
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep it",
    });
    if (!sure) return;
    setCancelling(true);
    setError(null);
    const r = await cancelBooking({ orgSlug: org.slug, reference: appt.reference });
    setCancelling(false);
    if (!r.ok) {
      setError(r.error ?? "Could not cancel the booking.");
      return;
    }
    setChanged("cancelled");
    setEmailed(Boolean(r.emailed));
    router.refresh();
  }

  const cancelled = changed === "cancelled" || appt.status === "cancelled";
  const heading = cancelled ? "This booking is cancelled" : changed === "rescheduled" ? "Your booking has moved" : appt.status === "completed" ? "This visit has happened" : "You're booked";
  const lead = cancelled
    ? "The slot is open again. Book again whenever you are ready."
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
              <Pill size="sm" variant="danger" onClick={cancel} loading={cancelling} loadingLabel="Cancelling">
                Cancel this booking
              </Pill>
            </div>
          ) : cancelled ? (
            <div className="mt-6 border-t border-divider pt-6">
              <Pill asChild size="sm">
                <Link href={`/${org.slug}/book`}>Book again</Link>
              </Pill>
            </div>
          ) : null}
        </main>
      </div>

      <p className="mx-auto w-full max-w-step px-4 pb-10 pt-6 text-small text-text-2 md:px-6">
        See your pets and past visits in{" "}
        <Link href="/me" className="font-medium text-text hover:underline">
          your Kalinga
        </Link>
        .
      </p>

      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent className="flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-sheet border-0 bg-sheet p-6 shadow-lifted sm:max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">Pick a new time</DialogTitle>
            <DialogDescription className="text-small text-text-2">With {provider?.name}. Your current slot opens up for someone else.</DialogDescription>
          </DialogHeader>
          {appt.serviceId ? (
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
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
              {slot ? "Move my booking" : "Pick a time"}
            </Pill>
          </div>
        </DialogContent>
      </Dialog>

      <PublicFooter />
    </div>
  );
}
