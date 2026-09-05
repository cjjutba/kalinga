"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TZDate } from "@date-fns/tz";
import { addMinutes, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { SlotPicker } from "@/components/booking/slot-picker";
import type { Slot } from "@/lib/mock/slots";
import type { Appointment, Owner, Pet, Provider, Service } from "@/lib/mock/types";
import { useOrg } from "@/lib/mock/store";
import { clinicNow, formatShortDate, formatTimeWithZone } from "@/lib/time";

// The four dialogs the day view needs. Each writes to the store the way a
// server action will, and closes.

function Frame({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-sheet border-0 bg-sheet p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)] sm:p-7">
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

export function CancelDialog({ orgSlug, appointment, open, onOpenChange }: { orgSlug: string; appointment: Appointment | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { dispatch } = useOrg(orgSlug);
  const [reason, setReason] = useState(reasons[0]);
  const [other, setOther] = useState("");
  if (!appointment) return null;
  return (
    <Frame open={open} onOpenChange={onOpenChange} title="Cancel this appointment" description="The slot opens up again and the reason goes in the audit trail.">
      <SelectField label="Reason" value={reason} onChange={setReason} options={reasons.map((r) => ({ value: r, label: r }))} />
      {reason === "Other" ? <TextareaField label="What happened" rows={3} value={other} onChange={(e) => setOther(e.target.value)} /> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Keep it
        </Pill>
        <Pill
          variant="danger"
          size="sm"
          onClick={() => {
            dispatch({ type: "appointment/status", id: appointment.id, status: "cancelled", reason: reason === "Other" ? other || "Other" : reason });
            onOpenChange(false);
          }}
        >
          Cancel appointment
        </Pill>
      </div>
    </Frame>
  );
}

export function RescheduleDialog({ orgSlug, appointment, open, onOpenChange }: { orgSlug: string; appointment: Appointment | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { org, providers, services, appointments, dispatch } = useOrg(orgSlug);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  if (!appointment) return null;
  const provider = providers.find((p) => p.id === (providerId ?? appointment.providerId)) ?? providers[0];
  const service = services.find((s) => s.id === appointment.serviceId) ?? { durationMin: 30, bufferMin: 0 };
  return (
    <Frame open={open} onOpenChange={onOpenChange} title="Move this appointment" description={`Currently ${formatShortDate(appointment.startsAt, org.timezone)}, ${formatTimeWithZone(appointment.startsAt, org.timezone)}.`}>
      <SelectField label="With" value={provider.id} onChange={(v) => { setProviderId(v); setSlot(null); }} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
      <SlotPicker tz={org.timezone} provider={provider} service={service} appointments={appointments} value={slot} onChange={setSlot} excludeAppointmentId={appointment.id} compact />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Keep the time
        </Pill>
        <Pill
          size="sm"
          disabled={!slot}
          onClick={() => {
            if (!slot) return;
            dispatch({ type: "appointment/reschedule", id: appointment.id, startsAt: slot.startsAt, endsAt: slot.endsAt, providerId: provider.id });
            onOpenChange(false);
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
      <InputField label="Pet" placeholder="Search by pet, owner or mobile" value={query} onChange={(e) => setQuery(e.target.value)} helper={chosen ? `Chosen: ${chosen.name}, ${chosenOwner?.name ?? ""}` : undefined} />
      <ul role="listbox" aria-label="Matching pets" className="flex max-h-56 flex-col gap-1 overflow-y-auto">
        {options.map(({ pet, owner }) => {
          const selected = pet.id === value;
          return (
            <li key={pet.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange(pet.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-input px-3 py-2 text-left text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${selected ? "bg-action text-on-action" : "bg-field hover:bg-divider"}`}
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {pet.name}, {pet.breed}
                  </span>
                  <span className={`block truncate ${selected ? "text-on-action/80" : "text-text-2"}`}>{owner?.name}</span>
                </span>
                {!owner?.mobile ? <span className={`shrink-0 text-label ${selected ? "text-on-action/80" : "text-text-3"}`}>No mobile</span> : null}
              </button>
            </li>
          );
        })}
        {options.length === 0 ? <li className="px-3 py-2 text-small text-text-2">No pet matches. Add the client first.</li> : null}
      </ul>
    </div>
  );
}

export function NewAppointmentDialog({ orgSlug, open, onOpenChange, day, defaultPetId }: { orgSlug: string; open: boolean; onOpenChange: (o: boolean) => void; day?: Date; defaultPetId?: string }) {
  const { org, pets, owners, services, providers, appointments, dispatch } = useOrg(orgSlug);
  const bookable = services.filter((s) => s.publiclyBookable);
  const [petId, setPetId] = useState<string | null>(defaultPetId ?? null);
  const [serviceId, setServiceId] = useState(bookable[0]?.id ?? "");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState("");
  const service = services.find((s) => s.id === serviceId) as Service | undefined;
  const provider = providers.find((p) => p.id === providerId) as Provider | undefined;
  const pet = pets.find((p) => p.id === petId);

  function book() {
    if (!pet || !service || !provider || !slot) return;
    dispatch({
      type: "appointment/create",
      appointment: { organisationId: org.id, ownerId: pet.ownerId, petId: pet.id, serviceId: service.id, providerId: provider.id, startsAt: slot.startsAt, endsAt: slot.endsAt, status: "booked", source: "staff", note: note || undefined },
    });
    onOpenChange(false);
    setPetId(null);
    setSlot(null);
    setNote("");
  }

  return (
    <Frame open={open} onOpenChange={onOpenChange} title="New appointment" description="Booked at the desk. The owner gets the same confirmation text as an online booking.">
      <PetPicker pets={pets} owners={owners} value={petId} onChange={setPetId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Service" value={serviceId} onChange={(v) => { setServiceId(v); setSlot(null); }} options={bookable.map((s) => ({ value: s.id, label: `${s.name}, ${s.durationMin} min` }))} />
        <SelectField label="With" value={providerId} onChange={(v) => { setProviderId(v); setSlot(null); }} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
      </div>
      {service && provider ? <SlotPicker tz={org.timezone} provider={provider} service={service} appointments={appointments} value={slot} onChange={setSlot} startDay={day} compact /> : null}
      <TextareaField label="Note for the vet" hint="Optional" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Pill>
        <Pill size="sm" disabled={!pet || !slot} onClick={book}>
          {pet && slot ? `Book ${pet.name}, ${formatShortDate(slot.startsAt, org.timezone)} ${formatTimeWithZone(slot.startsAt, org.timezone)}` : "Pick a pet and a time"}
        </Pill>
      </div>
    </Frame>
  );
}

export function WalkInDialog({ orgSlug, open, onOpenChange }: { orgSlug: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { org, pets, owners, services, providers, dispatch } = useOrg(orgSlug);
  const [petId, setPetId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const pet = pets.find((p) => p.id === petId);

  function add() {
    if (!pet) return;
    const now = clinicNow(org.timezone);
    const start = setMilliseconds(setSeconds(setMinutes(now, Math.floor(now.getMinutes() / 15) * 15), 0), 0) as TZDate;
    const service = services.find((s) => s.id === serviceId);
    dispatch({
      type: "appointment/create",
      appointment: {
        organisationId: org.id,
        ownerId: pet.ownerId,
        petId: pet.id,
        serviceId: service?.id ?? null,
        providerId,
        startsAt: start.toISOString(),
        endsAt: addMinutes(start, service?.durationMin ?? 30).toISOString(),
        status: "arrived",
        source: "walk_in",
        note: note || (service ? undefined : "Walked in, service not chosen yet"),
      },
    });
    onOpenChange(false);
    setPetId(null);
    setServiceId("");
    setNote("");
  }

  return (
    <Frame open={open} onOpenChange={onOpenChange} title="Walk-in" description="Marked arrived now. The service can be chosen when the vet sees them.">
      <PetPicker pets={pets} owners={owners} value={petId} onChange={setPetId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Service" hint="Optional" value={serviceId} onChange={setServiceId} options={[{ value: "", label: "Not chosen yet" }, ...services.map((s) => ({ value: s.id, label: s.name }))]} />
        <SelectField label="Seen by" value={providerId} onChange={setProviderId} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
      </div>
      <TextareaField label="What they came in for" hint="Optional" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Pill variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Pill>
        <Pill size="sm" disabled={!pet} onClick={add}>
          {pet ? `Check in ${pet.name}` : "Pick a pet"}
        </Pill>
      </div>
    </Frame>
  );
}
