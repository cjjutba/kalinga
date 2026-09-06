"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { SlotPicker, type Slot } from "./slot-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import type { getBookingByReference } from "@/lib/db/queries";
import { getPublicSlots } from "@/lib/actions/slots";
import { cancelBooking, rescheduleBooking } from "@/lib/actions/public";
import { renderBookingChanged, renderBookingConfirmation } from "@/content/templates";
import { formatLongDate, formatPeso, formatShortDate, formatTimeWithZone } from "@/lib/time";
import { firstName } from "@/lib/domain/selectors";

type Booking = NonNullable<Awaited<ReturnType<typeof getBookingByReference>>>;

// Confirmation and manage booking on one page, because the link in the
// message is the same link. The confirmation text is shown here, ready to
// copy, and the owner can move or cancel their own booking. The reference is
// the key: it is long enough to guess badly and short enough to read aloud.

export function BookingConfirmation({ data, emailedOnBooking = false }: { data: Booking; emailedOnBooking?: boolean }) {
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

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="grid size-12 place-items-center rounded-full bg-action text-on-action" aria-hidden>
            <Check className="size-6" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-title font-medium text-balance">{changed === "cancelled" || appt.status === "cancelled" ? "This booking is cancelled" : changed === "rescheduled" ? "Moved" : appt.status === "completed" ? "This visit has happened" : "You're booked"}</h1>
          <p className="mt-1 text-small text-text-2">
            Reference <span className="tabular font-medium text-text">{appt.reference}</span>. Keep this page, it is how you change or cancel.
            {emailed && owner?.email ? <> A copy has gone to {owner.email}.</> : null}
          </p>
        </div>
        <StatusPill status={appt.status} />
      </div>

      <Card className="mt-6 p-5">
        <dl className="flex flex-col gap-3 text-body">
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">When</dt>
            <dd className="text-right tabular">
              {formatLongDate(appt.startsAt, tz)}
              <br />
              {formatTimeWithZone(appt.startsAt, tz)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">What</dt>
            <dd className="text-right">
              {service?.name ?? "Visit"}
              {service ? `, ${formatPeso(service.pricePhp)}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">With</dt>
            <dd className="text-right">{provider?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">For</dt>
            <dd className="text-right">{pet?.name}</dd>
          </div>
          {org.address ? (
            <div className="flex justify-between gap-4">
              <dt className="text-text-2">Where</dt>
              <dd className="text-right">{org.address}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <section className="mt-6" aria-labelledby="msg">
        <h2 id="msg" className="text-label font-medium text-text-2">
          Your confirmation
        </h2>
        <blockquote className="mt-2 rounded-guide bg-sheet p-4 text-small leading-[1.5]">{message}</blockquote>
        <Pill
          size="sm"
          variant="secondary"
          className="mt-3"
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
          {copied ? <Check className="size-4" strokeWidth={2} aria-hidden /> : <Copy className="size-4" strokeWidth={1.5} aria-hidden />}
          {copied ? "Copied" : "Copy message"}
        </Pill>
      </section>

      {error ? (
        <p role="alert" className="mt-4 text-small text-error">
          {error}
        </p>
      ) : null}

      {canChange ? (
        <div className="mt-8 flex flex-col gap-2">
          <Pill block variant="secondary" onClick={() => setMoving(true)}>
            Change the time
          </Pill>
          <Pill block variant="text" onClick={() => setCancelling(true)}>
            Cancel this booking
          </Pill>
        </div>
      ) : appt.status === "cancelled" ? (
        <Pill asChild block className="mt-8">
          <Link href={`/${org.slug}/book`}>Book again</Link>
        </Pill>
      ) : null}

      <p className="mt-8 text-center text-small text-text-2">
        Want to see your pets and past visits?{" "}
        <Link href="/me" className="font-medium text-text hover:underline">
          Open your Kalinga
        </Link>
      </p>

      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-lg overflow-y-auto rounded-sheet border-0 bg-sheet p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-md rounded-sheet border-0 bg-sheet p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
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
    </main>
  );
}
