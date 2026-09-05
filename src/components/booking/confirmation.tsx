"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { SlotPicker } from "./slot-picker";
import { ClinicNotFound } from "./clinic-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { useStore } from "@/lib/mock/store";
import type { Slot } from "@/lib/mock/slots";
import { renderBookingChanged, renderBookingConfirmation } from "@/content/templates";
import { formatLongDate, formatPeso, formatShortDate, formatTimeWithZone } from "@/lib/time";

// Confirmation and manage booking on one page, because the link in the
// message is the same link. Nothing is sent, so the confirmation text is
// shown here, ready to copy. The owner can move or cancel their own booking.

export function BookingConfirmation({ slug, reference }: { slug: string; reference: string }) {
  const { state, dispatch } = useStore();
  const org = state.organisations.find((o) => o.slug === slug);
  const appt = useMemo(() => {
    const online = state.appointments.filter((a) => a.organisationId === org?.id && a.source === "online");
    if (reference === "latest") return [...online].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (reference === "KLG-DEMO") return online.filter((a) => new Date(a.startsAt) > new Date() && a.status !== "cancelled").sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    return state.appointments.find((a) => a.reference === reference);
  }, [state.appointments, org?.id, reference]);
  const [copied, setCopied] = useState(false);
  const [moving, setMoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [changed, setChanged] = useState<"cancelled" | "rescheduled" | null>(null);

  if (!org) return <ClinicNotFound />;
  if (!appt) {
    return (
      <main className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col justify-center gap-4 px-5 py-12 text-center">
        <h1 className="text-title font-medium">We could not find that booking</h1>
        <p className="text-body text-text-2">Check the reference in your message, or call {org.name} on <span className="tabular">{org.mobile}</span>.</p>
        <Pill asChild block variant="secondary">
          <Link href={`/${org.slug}`}>Back to the clinic</Link>
        </Pill>
      </main>
    );
  }
  const tz = org.timezone;
  const pet = state.pets.find((p) => p.id === appt.petId);
  const owner = state.owners.find((o) => o.id === appt.ownerId);
  const service = state.services.find((s) => s.id === appt.serviceId);
  const provider = state.providers.find((p) => p.id === appt.providerId);
  const ctx = {
    petName: pet?.name ?? "your pet",
    ownerName: owner?.name.split(" ")[0] ?? "there",
    clinicName: org.name,
    serviceName: service?.name ?? "your visit",
    when: `${formatShortDate(appt.startsAt, tz)}, ${formatTimeWithZone(appt.startsAt, tz)}`,
    reference: appt.reference,
    manageUrl: `kalinga.cjjutba.dev/${org.slug}/b/${appt.reference}`,
  };
  const message = changed ? renderBookingChanged(ctx, changed) : renderBookingConfirmation(ctx);
  const past = new Date(appt.startsAt) < new Date();
  const canChange = !past && appt.status !== "cancelled" && appt.status !== "completed";

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="grid size-12 place-items-center rounded-full bg-action text-on-action" aria-hidden>
            <Check className="size-6" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-title font-medium text-balance">{changed === "cancelled" ? "Cancelled" : changed === "rescheduled" ? "Moved" : appt.status === "cancelled" ? "This booking was cancelled" : "You're booked"}</h1>
          <p className="mt-1 text-small text-text-2">
            Reference <span className="tabular font-medium text-text">{appt.reference}</span>. Keep this page, it is how you change or cancel.
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
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">Where</dt>
            <dd className="text-right">{org.address}</dd>
          </div>
        </dl>
      </Card>

      <section className="mt-6" aria-labelledby="msg">
        <div className="flex items-baseline justify-between">
          <h2 id="msg" className="text-label font-medium text-text-2">
            Your confirmation
          </h2>
          <span className="text-label text-text-2">Nothing is sent in the demo. It shows here.</span>
        </div>
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
        <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-sheet border-0 bg-sheet p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">Pick a new time</DialogTitle>
            <DialogDescription className="text-small text-text-2">With {provider?.name}. Your current slot opens up for someone else.</DialogDescription>
          </DialogHeader>
          {provider && service ? (
            <div className="mt-4">
              <SlotPicker tz={tz} provider={provider} service={service} appointments={state.appointments.filter((a) => a.organisationId === org.id)} value={slot} onChange={setSlot} excludeAppointmentId={appt.id} compact />
            </div>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Pill size="sm" variant="secondary" onClick={() => setMoving(false)}>
              Keep my time
            </Pill>
            <Pill
              size="sm"
              disabled={!slot}
              onClick={() => {
                if (!slot) return;
                dispatch({ type: "org/set", orgId: org.id });
                dispatch({ type: "appointment/reschedule", id: appt.id, startsAt: slot.startsAt, endsAt: slot.endsAt });
                setChanged("rescheduled");
                setMoving(false);
                setSlot(null);
              }}
            >
              {slot ? `Move to ${formatShortDate(slot.startsAt, tz)}, ${formatTimeWithZone(slot.startsAt, tz)}` : "Pick a time"}
            </Pill>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelling} onOpenChange={setCancelling}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-sheet border-0 bg-sheet p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">Cancel this booking?</DialogTitle>
            <DialogDescription className="text-small text-text-2">The clinic will see it straight away. You can book again any time.</DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Pill size="sm" variant="secondary" onClick={() => setCancelling(false)}>
              Keep it
            </Pill>
            <Pill
              size="sm"
              variant="danger"
              onClick={() => {
                dispatch({ type: "org/set", orgId: org.id });
                dispatch({ type: "appointment/status", id: appt.id, status: "cancelled", reason: "Cancelled by the owner online" });
                setChanged("cancelled");
                setCancelling(false);
              }}
            >
              Cancel booking
            </Pill>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
