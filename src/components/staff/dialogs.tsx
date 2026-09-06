"use client";

import { placeholder } from "@/content/placeholders";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { SlotPicker, type Slot } from "@/components/booking/slot-picker";
import { getStaffSlots } from "@/lib/actions/slots";
import type { Appointment, Owner, Pet } from "@/lib/domain/types";
import { useOrg } from "@/lib/org-data";
import { clinicNow, formatShortDate, formatTimeWithZone } from "@/lib/time";

// The four dialogs the day view needs. Each dispatches a command the server
// applies, then closes. Slots come from the server through the same engine
// the public page uses.

export function Frame({
  open,
  onOpenChange,
  title,
  description,
  busy = false,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  /** Work is in flight inside. Nothing closes the dialog until it settles. */
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return onOpenChange(true);
        // Escape, a click outside and the corner cross all wait. The dialog
        // that started the work is the one that reports it finished.
        if (!busy) onOpenChange(false);
      }}
    >
      <DialogContent showCloseButton={!busy} className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-lg overflow-y-auto rounded-sheet border-0 bg-sheet p-6 shadow-lifted sm:p-7">
        <DialogHeader className="text-left">
          <DialogTitle className="text-heading font-medium">{title}</DialogTitle>
          {description ? <DialogDescription className="text-small text-text-2">{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

const reasons = ["Owner rescheduled by phone", "Pet unwell, owner asked to wait", "Owner travelling", "Booked twice by mistake", "Clinic closed unexpectedly", "Other"];

export function CancelDialog({ appointment, open, onOpenChange }: { orgSlug?: string; appointment: Appointment | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { dispatch } = useOrg();
  const [reason, setReason] = useState(reasons[0]);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  if (!appointment) return null;
  return (
    <Frame open={open} onOpenChange={onOpenChange} busy={busy} title="Cancel this appointment" description="The slot opens up again and the reason goes in the audit trail.">
      <SelectField label="Reason" value={reason} onChange={setReason} options={reasons.map((r) => ({ value: r, label: r }))} />
      {reason === "Other" ? <TextareaField label="What happened" placeholder={placeholder.reason} rows={3} value={other} onChange={(e) => setOther(e.target.value)} /> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
          Keep it
        </Pill>
        <Pill
          variant="danger"
          size="sm"
          loading={busy}
          loadingLabel="Cancelling"
          onClick={async () => {
            setBusy(true);
            const r = await dispatch({ type: "appointment/status", id: appointment.id, status: "cancelled", reason: reason === "Other" ? other || "Other" : reason });
            setBusy(false);
            if (r.ok) onOpenChange(false);
          }}
        >
          Cancel appointment
        </Pill>
      </div>
    </Frame>
  );
}

export function RescheduleDialog({ appointment, open, onOpenChange, onDone }: { orgSlug?: string; appointment: Appointment | null; open: boolean; onOpenChange: (o: boolean) => void; /** Called with the new start so the day view can follow the appointment. */ onDone?: (startsAt: string) => void }) {
  const { org, providers, services, dispatch } = useOrg();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const effectiveProvider = providerId ?? appointment?.providerId ?? providers[0]?.id ?? "";
  const effectiveService = serviceId ?? appointment?.serviceId ?? services[0]?.id ?? "";
  const load = useCallback((from: Date, days: number) => getStaffSlots({ orgSlug: org.slug, serviceId: effectiveService, providerId: effectiveProvider, from: from.toISOString(), days, excludeAppointmentId: appointment?.id }), [org.slug, effectiveService, effectiveProvider, appointment?.id]);
  if (!appointment) return null;
  const provider = providers.find((p) => p.id === effectiveProvider);
  return (
    <Frame open={open} onOpenChange={onOpenChange} busy={busy} title="Move this appointment" description={`Currently ${formatShortDate(appointment.startsAt, org.timezone)}, ${formatTimeWithZone(appointment.startsAt, org.timezone)}.`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="With" value={effectiveProvider} onChange={(v) => { setProviderId(v); setSlot(null); }} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <SelectField label="Service" value={effectiveService} onChange={(v) => { setServiceId(v); setSlot(null); }} options={services.map((s) => ({ value: s.id, label: `${s.name}, ${s.durationMin} min` }))} helper={!appointment.serviceId ? "Walk-in had no service. Pick one to size the slot." : undefined} />
      </div>
      {effectiveService && effectiveProvider ? <SlotPicker tz={org.timezone} load={load} value={slot} onChange={setSlot} who={provider?.name ?? ""} startDay={appointment ? new Date(appointment.startsAt) : undefined} reloadKey={`${effectiveService}:${effectiveProvider}`} compact /> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
          Keep the time
        </Pill>
        <Pill
          size="sm"
          disabled={!slot}
          loading={busy}
          loadingLabel="Moving"
          onClick={async () => {
            if (!slot) return;
            setBusy(true);
            const r = await dispatch({ type: "appointment/reschedule", id: appointment.id, startsAt: slot.startsAt, endsAt: slot.endsAt, providerId: effectiveProvider });
            setBusy(false);
            if (r.ok) {
              onOpenChange(false);
              onDone?.(slot.startsAt);
            }
          }}
        >
          {slot ? `Move to ${formatShortDate(slot.startsAt, org.timezone)}, ${formatTimeWithZone(slot.startsAt, org.timezone)}` : "Pick a new time"}
        </Pill>
      </div>
    </Frame>
  );
}

function usePetOptions(pets: Pet[], owners: Owner[], query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return pets
      .map((p) => ({ pet: p, owner: owners.find((o) => o.id === p.ownerId) }))
      .filter(({ pet, owner }) => !q || pet.name.toLowerCase().includes(q) || owner?.name.toLowerCase().includes(q) || owner?.mobile?.replace(/\s/g, "").includes(q.replace(/\s/g, "")))
      .slice(0, 8);
  }, [pets, owners, query]);
}

function PetPicker({ pets, owners, value, onChange }: { pets: Pet[]; owners: Owner[]; value: string | null; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const options = usePetOptions(pets, owners, query);
  const chosen = pets.find((p) => p.id === value);
  const chosenOwner = chosen ? owners.find((o) => o.id === chosen.ownerId) : undefined;
  return (
    <div className="flex flex-col gap-2">
      <InputField label="Pet" placeholder={placeholder.searchPetOrOwner} value={query} onChange={(e) => setQuery(e.target.value)} helper={chosen ? `Chosen: ${chosen.name}, ${chosenOwner?.name ?? ""}` : pets.length === 0 ? "No pets on file yet. Add the client and pet first." : undefined} />
      <ul role="listbox" aria-label="Matching pets" className="flex max-h-56 flex-col gap-1 overflow-y-auto">
        {options.map(({ pet, owner }) => {
          const selected = pet.id === value;
          return (
            <li key={pet.id}>
              <button type="button" role="option" aria-selected={selected} onClick={() => onChange(pet.id)} className={`flex w-full items-center justify-between gap-3 rounded-input px-3 py-2 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected ? "bg-action text-on-action" : "bg-field hover:bg-divider"}`}>
                <span className="min-w-0">
                  <span className="block font-medium">
                    {pet.name}, {pet.breed}
                  </span>
                  <span className={`block truncate ${selected ? "text-on-action/80" : "text-text-2"}`}>{owner?.name}</span>
                </span>
                {!owner?.mobile ? <span className={`shrink-0 text-label ${selected ? "text-on-action/80" : "text-text-2"}`}>No mobile</span> : null}
              </button>
            </li>
          );
        })}
        {options.length === 0 && pets.length > 0 ? <li className="px-3 py-2 text-small text-text-2">No pet matches. Add the client first.</li> : null}
      </ul>
    </div>
  );
}

export function NewAppointmentDialog({ open, onOpenChange, day, defaultPetId, onDone }: { orgSlug?: string; open: boolean; onOpenChange: (o: boolean) => void; day?: Date; defaultPetId?: string; onDone?: (startsAt: string) => void }) {
  const { org, pets, owners, services, providers, dispatch } = useOrg();
  const [petId, setPetId] = useState<string | null>(defaultPetId ?? null);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const pet = pets.find((p) => p.id === petId);
  const provider = providers.find((p) => p.id === providerId);
  const load = useCallback((from: Date, days: number) => getStaffSlots({ orgSlug: org.slug, serviceId, providerId, from: from.toISOString(), days }), [org.slug, serviceId, providerId]);

  async function book() {
    if (!pet || !serviceId || !providerId || !slot) return;
    setBusy(true);
    const r = await dispatch({ type: "appointment/create", appointment: { ownerId: pet.ownerId, petId: pet.id, serviceId, providerId, startsAt: slot.startsAt, endsAt: slot.endsAt, status: "booked", source: "staff", note: note || undefined } });
    setBusy(false);
    if (r.ok) {
      onOpenChange(false);
      onDone?.(slot.startsAt);
      setPetId(null);
      setSlot(null);
      setNote("");
    }
  }

  return (
    <Frame open={open} onOpenChange={onOpenChange} busy={busy} title="New appointment" description="Booked at the desk. The owner gets the same confirmation text as an online booking.">
      <PetPicker pets={pets} owners={owners} value={petId} onChange={setPetId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Service" value={serviceId} onChange={(v) => { setServiceId(v); setSlot(null); }} options={services.map((s) => ({ value: s.id, label: `${s.name}, ${s.durationMin} min` }))} />
        <SelectField label="With" value={providerId} onChange={(v) => { setProviderId(v); setSlot(null); }} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
      </div>
      {serviceId && providerId ? <SlotPicker tz={org.timezone} load={load} value={slot} onChange={setSlot} who={provider?.name ?? ""} startDay={day} reloadKey={`${serviceId}:${providerId}`} compact /> : <p className="text-small text-text-2">Add a service and someone to the schedule in Settings before booking.</p>}
      <TextareaField label="Note for the vet" hint="Optional" placeholder={placeholder.appointmentNote} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Pill>
        <Pill size="sm" disabled={!pet || !slot} loading={busy} loadingLabel="Booking" onClick={book}>
          Book appointment
        </Pill>
      </div>
    </Frame>
  );
}

export function WalkInDialog({ open, onOpenChange, onDone }: { orgSlug?: string; open: boolean; onOpenChange: (o: boolean) => void; onDone?: (startsAt: string) => void }) {
  const { org, pets, owners, services, providers, dispatch } = useOrg();
  const [petId, setPetId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const pet = pets.find((p) => p.id === petId);

  async function add() {
    if (!pet || !providerId) return;
    const now = clinicNow(org.timezone);
    const start = new Date(now.getTime());
    start.setUTCMinutes(Math.floor(start.getUTCMinutes() / 15) * 15, 0, 0);
    const service = services.find((s) => s.id === serviceId);
    setBusy(true);
    const r = await dispatch({
      type: "appointment/create",
      appointment: {
        ownerId: pet.ownerId,
        petId: pet.id,
        serviceId: service?.id ?? null,
        providerId,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + (service?.durationMin ?? 30) * 60_000).toISOString(),
        status: "arrived",
        source: "walk_in",
        note: note || (service ? undefined : "Walked in, service not chosen yet"),
      },
    });
    setBusy(false);
    if (r.ok) {
      onOpenChange(false);
      onDone?.(start.toISOString());
      setPetId(null);
      setServiceId("");
      setNote("");
    }
  }

  return (
    <Frame open={open} onOpenChange={onOpenChange} busy={busy} title="Walk-in" description="Marked arrived now. The service can be chosen when the vet sees them.">
      <PetPicker pets={pets} owners={owners} value={petId} onChange={setPetId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Service" hint="Optional" value={serviceId} onChange={setServiceId} options={[{ value: "", label: "Not chosen yet" }, ...services.map((s) => ({ value: s.id, label: s.name }))]} />
        <SelectField label="Seen by" value={providerId} onChange={setProviderId} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
      </div>
      <TextareaField label="What they came in for" hint="Optional" placeholder={placeholder.appointmentNote} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Pill>
        <Pill size="sm" disabled={!pet || !providerId} loading={busy} loadingLabel="Checking in" onClick={add}>
          {pet ? "Check in" : "Pick a pet"}
        </Pill>
      </div>
    </Frame>
  );
}
