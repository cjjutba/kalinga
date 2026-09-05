"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { PageHeader, EmptyState, NotForRole } from "./page-header";
import { NewAppointmentDialog } from "./dialogs";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card, Row } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/lib/mock/store";
import { dueItems, recallLabel, soonest } from "@/lib/mock/recall";
import { ageLabel, speciesLabel } from "@/lib/mock/selectors";
import { can, roleLabel } from "@/lib/roles";
import { dueLabel, formatDate, formatShortDate, formatTime } from "@/lib/time";
import { useUiState } from "@/lib/use-ui-state";
import type { Pet } from "@/lib/mock/types";

// Pets, and the record a vet opens mid consultation. Who the animal is, what
// happened last time, what is due next. The recall dates are the part that
// matters. Front desk sees dates and appointments, not visit notes.

function resolvePet(id: string, pets: Pet[]): Pet | undefined {
  if (id === "first") return pets[0];
  return pets.find((p) => p.id === id);
}

export function PetsList({ orgSlug }: { orgSlug: string }) {
  const { org, pets, owners, role } = useOrg(orgSlug);
  const ui = useUiState<"empty" | "loading">();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    if (ui === "empty") return [];
    const s = q.trim().toLowerCase();
    return pets
      .map((p) => ({ pet: p, owner: owners.find((o) => o.id === p.ownerId), due: soonest(dueItems(p, org)) }))
      .filter(({ pet, owner }) => !s || pet.name.toLowerCase().includes(s) || pet.breed.toLowerCase().includes(s) || owner?.name.toLowerCase().includes(s))
      .sort((a, b) => a.pet.name.localeCompare(b.pet.name));
  }, [pets, owners, org, q, ui]);
  if (!can(role, "view_clients")) return <NotForRole role={roleLabel[role]} page="Pets" />;
  return (
    <>
      <PageHeader
        title="Pets"
        lead={`${pets.length} on file`}
        actions={
          can(role, "edit_clients") ? (
            <Pill asChild size="sm">
              <Link href={`/app/${org.slug}/pets/new`}>
                <Plus className="size-4" strokeWidth={1.5} aria-hidden /> New pet
              </Link>
            </Pill>
          ) : null
        }
      />
      <div className="mb-4 max-w-md">
        <InputField on="page" label="Search" placeholder="Pet, breed or owner" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
      </div>
      {ui === "loading" ? (
        <ul className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="rounded-guide bg-sheet p-4">
              <Skeleton className="h-5 w-1/4 rounded-tag bg-field" />
              <Skeleton className="mt-2 h-4 w-1/3 rounded-tag bg-field" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState title={q ? `No pet matches "${q}"` : "No pets on file"} lead={q ? "Try the owner's name." : "Pets are added when a client books, or from their client page."} />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(({ pet, owner, due }) => (
            <li key={pet.id}>
              <Row
                href={`/app/${org.slug}/pets/${pet.id}`}
                title={
                  <>
                    {pet.name}
                    <span className="text-text-2">, {pet.breed}</span>
                  </>
                }
                secondary={owner?.name}
                trailing={
                  <>
                    {due && due.state !== "upcoming" ? <StatusPill status={due.state === "overdue" ? "overdue" : "due"} size="sm" /> : null}
                    <ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function PetRecord({ orgSlug, id }: { orgSlug: string; id: string }) {
  const { org, pets, owners, appointments, visits, services, providers, role } = useOrg(orgSlug);
  const [bookOpen, setBookOpen] = useState(false);
  const pet = resolvePet(id, pets);
  if (!can(role, "view_clients")) return <NotForRole role={roleLabel[role]} page="Pets" />;
  if (!pet) return <EmptyState title="That pet is not on file" action={<Pill asChild size="sm" variant="secondary"><Link href={`/app/${org.slug}/pets`}>Back to pets</Link></Pill>} />;
  const owner = owners.find((o) => o.id === pet.ownerId);
  const due = dueItems(pet, org);
  const history = visits.filter((v) => v.petId === pet.id).sort((a, b) => b.at.localeCompare(a.at));
  const upcoming = appointments.filter((a) => a.petId === pet.id && new Date(a.startsAt) >= new Date() && a.status !== "cancelled").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const seeNotes = can(role, "view_visit_notes");
  const tz = org.timezone;

  return (
    <>
      <PageHeader
        title={
          <>
            {pet.name}
            <span className="text-text-2">, {pet.breed}</span>
          </>
        }
        lead={
          <>
            {speciesLabel[pet.species]}, {pet.sex}, {ageLabel(pet.birthDate, tz)}, {pet.weightKg ? `${pet.weightKg} kg` : "weight not recorded"}. Owner{" "}
            <Link href={`/app/${org.slug}/clients/${pet.ownerId}`} className="font-medium text-text hover:underline">
              {owner?.name}
            </Link>
            {owner?.mobile ? <span className="tabular">, {owner.mobile}</span> : <span className="text-text-2">, no mobile on file</span>}
          </>
        }
        actions={
          <>
            {can(role, "edit_clients") ? (
              <Pill asChild size="sm" variant="secondary">
                <Link href={`/app/${org.slug}/pets/${pet.id}/edit`}>Edit</Link>
              </Pill>
            ) : null}
            {can(role, "manage_appointments") ? (
              <Pill size="sm" variant="secondary" onClick={() => setBookOpen(true)}>
                Book
              </Pill>
            ) : null}
            {can(role, "add_visit") ? (
              <Pill asChild size="sm">
                <Link href={`/app/${org.slug}/pets/${pet.id}/visit`}>
                  <Plus className="size-4" strokeWidth={1.5} aria-hidden /> Add visit
                </Link>
              </Pill>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="text-label font-medium text-text-2">Due next</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {due.map((d) => (
                <li key={d.kind} className="flex items-center justify-between gap-3 rounded-guide bg-field px-4 py-3">
                  <span>
                    <span className="block text-body font-medium">{recallLabel[d.kind]}</span>
                    <span className="block text-small text-text-2">
                      {d.last ? `Last ${formatDate(d.last, tz)}` : "No record yet"}
                      {d.dueOn ? `, next ${formatDate(d.dueOn, tz)}` : ""}
                    </span>
                  </span>
                  {d.state === "overdue" ? <StatusPill status="overdue" size="sm" /> : d.state === "due" ? <StatusPill status="due" size="sm" /> : d.dueOn ? <span className="text-label text-text-2">{dueLabel(d.dueOn, tz)}</span> : null}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="text-label font-medium text-text-2">Upcoming</h2>
            {upcoming.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-guide bg-field px-4 py-3">
                    <span className="text-small">
                      <span className="block text-body">{services.find((s) => s.id === a.serviceId)?.name ?? "Walk-in"}</span>
                      <span className="text-text-2 tabular">
                        {formatShortDate(a.startsAt, tz)}, {formatTime(a.startsAt, tz)}, {providers.find((p) => p.id === a.providerId)?.name}
                      </span>
                    </span>
                    <StatusPill status={a.status} size="sm" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-small text-text-2">Nothing booked.</p>
            )}
          </Card>
          {pet.notes ? (
            <Card className="p-5">
              <h2 className="text-label font-medium text-text-2">About {pet.name}</h2>
              <p className="mt-2 text-small">{pet.notes}</p>
            </Card>
          ) : null}
        </div>

        <Card className="p-5">
          <h2 className="text-label font-medium text-text-2">Visit history</h2>
          {!seeNotes ? <p className="mt-2 text-label text-text-2">Visit notes are for vets and the owner. The desk sees that a visit happened.</p> : null}
          {history.length ? (
            <ol className="mt-3 divide-y divide-divider">
              {history.map((v) => {
                const appt = appointments.find((a) => a.id === v.appointmentId);
                const svc = appt ? services.find((s) => s.id === appt.serviceId) : undefined;
                const prov = providers.find((p) => p.id === v.providerId);
                return (
                  <li key={v.id} className="py-3">
                    <Link href={`/app/${org.slug}/pets/${pet.id}/visits/${v.id}`} className="group flex items-start justify-between gap-3 rounded-tag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      <span className="min-w-0">
                        <span className="block text-body font-medium group-hover:underline">
                          {svc?.name ?? "Visit"}
                          <span className="font-normal text-text-2">, {formatDate(v.at, tz)}</span>
                        </span>
                        <span className="block text-small text-text-2">
                          {prov?.name}
                          {v.weightKg ? `, ${v.weightKg} kg` : ""}
                          {v.administered.length ? `, ${v.administered.join(", ")}` : ""}
                        </span>
                        {seeNotes ? <span className="mt-1 block text-small">{v.notes}</span> : null}
                      </span>
                      <ChevronRight className="mt-1 size-5 shrink-0 text-text-2" strokeWidth={1.5} />
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 text-small text-text-2">No visits yet. The first one will set the recall dates.</p>
          )}
        </Card>
      </div>
      <NewAppointmentDialog orgSlug={org.slug} open={bookOpen} onOpenChange={setBookOpen} defaultPetId={pet.id} />
    </>
  );
}

export function VisitDetail({ orgSlug, petId, visitId }: { orgSlug: string; petId: string; visitId: string }) {
  const { org, pets, visits, appointments, services, providers, role } = useOrg(orgSlug);
  const pet = resolvePet(petId, pets);
  const visit = visits.find((v) => v.id === visitId) ?? (visitId === "first" ? visits.find((v) => v.petId === pet?.id) : undefined);
  if (!can(role, "view_clients")) return <NotForRole role={roleLabel[role]} page="Visits" />;
  if (!pet || !visit) return <EmptyState title="That visit is not on file" action={<Pill asChild size="sm" variant="secondary"><Link href={`/app/${org.slug}/pets`}>Back to pets</Link></Pill>} />;
  const appt = appointments.find((a) => a.id === visit.appointmentId);
  const svc = appt ? services.find((s) => s.id === appt.serviceId) : undefined;
  const prov = providers.find((p) => p.id === visit.providerId);
  const seeNotes = can(role, "view_visit_notes");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`${pet.name}, ${svc?.name ?? "visit"}`}
        lead={
          <>
            {formatDate(visit.at, org.timezone)} with {prov?.name}.{" "}
            <Link href={`/app/${org.slug}/pets/${pet.id}`} className="font-medium text-text hover:underline">
              Back to the record
            </Link>
          </>
        }
      />
      <Card className="p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-body">
          <dt className="text-text-2">Weight</dt>
          <dd>{visit.weightKg ? `${visit.weightKg} kg` : "Not recorded"}</dd>
          <dt className="text-text-2">Administered</dt>
          <dd>{visit.administered.length ? visit.administered.join(", ") : "Nothing recorded"}</dd>
          <dt className="text-text-2">Payment</dt>
          <dd>
            {visit.paymentMethod === "gcash" ? "GCash" : visit.paymentMethod === "cash" ? "Cash" : "Not recorded"}
            {visit.paymentRef ? <span className="tabular">, ref {visit.paymentRef}</span> : null}
          </dd>
          <dt className="text-text-2">Notes</dt>
          <dd>{seeNotes ? visit.notes || "None" : <span className="text-text-2">Visit notes are for vets and the owner.</span>}</dd>
        </dl>
      </Card>
    </div>
  );
}

export function PetForm({ orgSlug, id }: { orgSlug: string; id?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { org, pets, owners, role, dispatch } = useOrg(orgSlug);
  const existing = id ? resolvePet(id, pets) : undefined;
  const [ownerId, setOwnerId] = useState(existing?.ownerId ?? params.get("owner") ?? owners[0]?.id ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [species, setSpecies] = useState<"dog" | "cat">(existing?.species ?? "dog");
  const [breed, setBreed] = useState(existing?.breed ?? "");
  const [sex, setSex] = useState<"male" | "female">(existing?.sex ?? "male");
  const [birthDate, setBirthDate] = useState(existing?.birthDate ?? "");
  const [weight, setWeight] = useState(existing?.weightKg?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | undefined>();
  if (!can(role, "edit_clients")) return <NotForRole role={roleLabel[role]} page="Editing pets" />;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("The pet needs a name.");
      return;
    }
    const newId = existing?.id ?? `pet_${Date.now().toString(36)}`;
    dispatch({
      type: "pet/upsert",
      pet: { id: newId, ownerId, name: name.trim(), species, breed: breed.trim() || (species === "dog" ? "Aspin" : "Puspin"), sex, birthDate: birthDate || new Date().toISOString().slice(0, 10), weightKg: weight ? Number(weight) : undefined, notes: notes.trim() || undefined, lastVaccination: existing?.lastVaccination, lastDeworming: existing?.lastDeworming, lastGroom: existing?.lastGroom },
    });
    router.push(`/app/${org.slug}/pets/${newId}`);
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-lg">
      <PageHeader title={existing ? `Edit ${existing.name}` : "New pet"} />
      <Card className="flex flex-col gap-5 p-6">
        <SelectField label="Owner" value={ownerId} onChange={setOwnerId} options={owners.map((o) => ({ value: o.id, label: o.name }))} />
        <InputField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} placeholder="Kiko" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Species" value={species} onChange={(v) => setSpecies(v as "dog" | "cat")} options={[{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }]} />
          <SelectField label="Sex" value={sex} onChange={(v) => setSex(v as "male" | "female")} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <InputField label="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={species === "dog" ? "Aspin" : "Puspin"} helper="Aspin and puspin are breeds here." />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Birth date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} hint="Or a best guess" />
          <InputField label="Weight, kg" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} hint="Optional" placeholder="8.5" />
        </div>
        <TextareaField label="Notes" hint="Optional" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nervous with clippers. Likes the groomer to go slow." />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill asChild size="sm" variant="secondary">
            <Link href={existing ? `/app/${org.slug}/pets/${existing.id}` : `/app/${org.slug}/pets`}>Cancel</Link>
          </Pill>
          <Pill type="submit" size="sm">
            {existing ? "Save changes" : "Add pet"}
          </Pill>
        </div>
      </Card>
    </form>
  );
}
