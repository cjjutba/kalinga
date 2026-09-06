"use client";

import { placeholder } from "@/content/placeholders";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, NotForRole } from "./page-header";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { useOrg } from "@/lib/org-data";
import { can, roleLabel } from "@/lib/roles";
import { formatShortDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

// What a vet writes mid consultation. Weight, what was administered, a note,
// and the cash or GCash reference the desk already records. Saving completes
// the appointment and moves the recall dates forward.

const administeredOptions: Record<string, string[]> = {
  vaccination: ["5-in-1 vaccine", "Anti-rabies vaccine", "Kennel cough vaccine", "Feline 4-in-1 vaccine"],
  deworming: ["Broad spectrum dewormer", "Tapeworm treatment"],
  grooming: ["Full groom", "Bath and blow dry", "Nail trim", "Ear clean"],
  other: ["Nail trim", "Ear clean", "Tick and flea spot-on", "Wound dressing"],
};

export function VisitForm({ orgSlug, petId }: { orgSlug: string; petId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { org, pets, appointments, services, providers, members, actorMemberId, role, dispatch } = useOrg(orgSlug);
  const pet = petId === "first" ? pets[0] : pets.find((p) => p.id === petId);
  const candidates = useMemo(
    () => appointments.filter((a) => a.petId === pet?.id && a.status !== "cancelled" && a.status !== "completed" && a.status !== "no_show").sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [appointments, pet?.id],
  );
  const actor = members.find((m) => m.id === actorMemberId);
  const [appointmentId, setAppointmentId] = useState(params.get("appointment") ?? candidates[0]?.id ?? "");
  // Seen by follows the appointment's vet first, then the signed in vet, then whoever is first on the schedule.
  const [providerId, setProviderId] = useState(() => appointments.find((a) => a.id === (params.get("appointment") ?? candidates[0]?.id))?.providerId ?? actor?.providerId ?? providers[0]?.id ?? "");
  const [weight, setWeight] = useState(pet?.weightKg?.toString() ?? "");
  const [chosen, setChosen] = useState<string[]>([]);
  const [extra, setExtra] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"cash" | "gcash" | "">("");
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  if (!can(role, "add_visit")) return <NotForRole role={roleLabel[role]} page="Adding a visit" />;
  if (!pet) return <EmptyState title="That pet is not on file" />;

  const appt = appointments.find((a) => a.id === appointmentId);
  const svc = appt ? services.find((s) => s.id === appt.serviceId) : undefined;
  const options = administeredOptions[svc?.recallKind ?? "other"];

  function toggle(item: string) {
    setChosen((c) => (c.includes(item) ? c.filter((x) => x !== item) : [...c, item]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!appointmentId) {
      setError("Pick the appointment this visit belongs to, or book one first.");
      return;
    }
    if (!notes.trim()) {
      setError("A line of notes, even a short one. It is what the next vet reads.");
      return;
    }
    setError(undefined);
    setBusy(true);
    const r = await dispatch({
      type: "visit/add",
      visit: {
        appointmentId,
        petId: pet!.id,
        providerId,
        at: new Date().toISOString(),
        weightKg: weight ? Number(weight) : undefined,
        notes: notes.trim(),
        administered: [...chosen, ...(extra.trim() ? [extra.trim()] : [])],
        paymentMethod: method || undefined,
        paymentRef: ref.trim() || undefined,
      },
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.push(`/app/${org.slug}/pets/${pet!.id}`);
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-lg">
      <PageHeader title={`Today's visit, ${pet.name}`} lead="Saving completes the appointment and sets the next recall date." />
      <Card className="flex flex-col gap-5 p-6">
        {candidates.length ? (
          <SelectField
            label="Appointment"
            value={appointmentId}
            onChange={(id) => {
              setAppointmentId(id);
              const next = appointments.find((a) => a.id === id);
              if (next) setProviderId(next.providerId);
            }}
            options={candidates.map((a) => ({
              value: a.id,
              label: `${formatShortDate(a.startsAt, org.timezone)}, ${formatTime(a.startsAt, org.timezone)}, ${services.find((s) => s.id === a.serviceId)?.name ?? "walk-in"}`,
            }))}
          />
        ) : (
          <p className="rounded-guide bg-field p-4 text-small text-text-2">{pet.name} has no open appointment. Book one or add a walk-in from the day view, then come back.</p>
        )}
        <SelectField label="Seen by" value={providerId} onChange={setProviderId} options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <InputField label="Weight, kg" inputMode="decimal" placeholder={placeholder.weightKg} value={weight} onChange={(e) => setWeight(e.target.value)} helper={pet.weightKg ? `Last recorded ${pet.weightKg} kg.` : "First weight on record."} />
        <fieldset>
          <legend className="text-label font-medium">Administered</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((item) => {
              const on = chosen.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(item)}
                  className={cn(
                    "h-9 rounded-full px-3.5 text-small font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
                    on ? "bg-action text-on-action" : "bg-field text-text hover:bg-divider",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <InputField label="Anything else" hint="Optional" value={extra} onChange={(e) => setExtra(e.target.value)} wrapperClassName="mt-3" placeholder={placeholder.visitAdministered} />
        </fieldset>
        <TextareaField label="Notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} error={error} placeholder={placeholder.vetNotes} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Paid by" hint="Optional" value={method} onChange={(v) => setMethod(v as "cash" | "gcash" | "")} options={[{ value: "", label: "Not yet" }, { value: "cash", label: "Cash" }, { value: "gcash", label: "GCash" }]} />
          <InputField label="Reference" hint="Optional" value={ref} onChange={(e) => setRef(e.target.value)} placeholder={placeholder.paymentRef} disabled={method !== "gcash"} />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill asChild size="sm" variant="secondary">
            <Link href={`/app/${org.slug}/pets/${pet.id}`}>Cancel</Link>
          </Pill>
          <Pill type="submit" size="sm" disabled={!candidates.length} loading={busy} loadingLabel="Saving">
            Save visit
          </Pill>
        </div>
      </Card>
    </form>
  );
}
