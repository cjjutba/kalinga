"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Frame } from "./dialogs";
import { NewPetDialog } from "./pets";
import { useToast } from "@/components/primitives/toast";
import { SelectField } from "@/components/primitives/field";
import { PageHeader, EmptyState, NotForRole } from "./page-header";
import { InputField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card, Row } from "@/components/primitives/surfaces";
import { DataTable, TableSkeleton } from "@/components/primitives/data-table";
import { StatusPill } from "@/components/primitives/status-pill";
import { useOrg } from "@/lib/org-data";
import { can, roleLabel } from "@/lib/roles";
import { formatDate, formatShortDate, formatTime } from "@/lib/time";
import { useUiState } from "@/lib/use-ui-state";
import type { Owner } from "@/lib/domain/types";

// Clients are the owners. Front desk creates and edits contact details, a vet
// reads them, the owner does everything. A missing mobile is a real state and
// is shown, not hidden.

function resolveId(id: string, owners: Owner[]): Owner | undefined {
  if (id === "first") return owners[0];
  return owners.find((o) => o.id === id);
}

export function ClientsList({ orgSlug }: { orgSlug: string }) {
  const { org, owners, pets, role } = useOrg(orgSlug);
  const ui = useUiState<"empty" | "loading">();
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const rows = useMemo(() => {
    if (ui === "empty") return [];
    const s = q.trim().toLowerCase();
    return owners
      .filter((o) => !s || o.name.toLowerCase().includes(s) || o.mobile?.replace(/\s/g, "").includes(s.replace(/\s/g, "")) || o.email?.toLowerCase().includes(s) || pets.some((p) => p.ownerId === o.id && p.name.toLowerCase().includes(s)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((o) => ({ owner: o, pets: pets.filter((p) => p.ownerId === o.id) }));
  }, [owners, pets, q, ui]);
  if (!can(role, "view_clients")) return <NotForRole role={roleLabel[role]} page="Clients" />;
  return (
    <>
      <PageHeader
        title="Clients"
        lead={`${owners.length} on file`}
        actions={
          can(role, "edit_clients") ? (
            <Pill size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" strokeWidth={1.5} aria-hidden /> New client
            </Pill>
          ) : null
        }
      />
      <NewClientDialog orgSlug={orgSlug} open={newOpen} onOpenChange={setNewOpen} />
      <div className="mb-4 max-w-md">
        <InputField on="page" label="Search" placeholder="Name, mobile or email" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
      </div>
      {ui === "loading" ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title={q ? `No client matches "${q}"` : "No clients yet"} lead={q ? "Try the mobile number, part of the name, or the pet's name." : "Clients appear here the first time they book or when the desk adds them."} />
      ) : (
        <DataTable
          rows={rows}
          rowKey={({ owner }) => owner.id}
          rowHref={({ owner }) => `/app/${org.slug}/clients/${owner.id}`}
          rowLabel={({ owner }) => owner.name}
          columns={[
            {
              key: "name",
              header: "Client",
              cell: ({ owner, pets: ps }) => (
                <>
                  <span className="block truncate text-body">{owner.name}</span>
                  <span className="mt-0.5 block truncate text-label text-text-2 sm:hidden">
                    {owner.mobile ?? "No mobile on file"}
                    {ps.length ? `, ${ps.map((p) => p.name).join(", ")}` : ""}
                  </span>
                </>
              ),
            },
            {
              key: "mobile",
              header: "Mobile",
              className: "hidden sm:table-cell",
              cell: ({ owner }) => (owner.mobile ? <span className="tabular text-text-2">{owner.mobile}</span> : <span className="text-text-3">Not on file</span>),
            },
            {
              key: "pets",
              header: "Pets",
              className: "hidden md:table-cell",
              cell: ({ pets: ps }) => (ps.length ? <span className="text-text-2">{ps.map((p) => p.name).join(", ")}</span> : <span className="text-text-3">None on file</span>),
            },
          ]}
        />
      )}
    </>
  );
}

export function ClientDetail({ orgSlug, id }: { orgSlug: string; id: string }) {
  const { org, owners, pets, appointments, services, providers, role } = useOrg(orgSlug);
  const [petOpen, setPetOpen] = useState(false);
  const owner = resolveId(id, owners);
  if (!can(role, "view_clients")) return <NotForRole role={roleLabel[role]} page="Clients" />;
  if (!owner) return <EmptyState title="That client is not on file" lead="They may have been removed, or the link is old." action={<Pill asChild size="sm" variant="secondary"><Link href={`/app/${org.slug}/clients`}>Back to clients</Link></Pill>} />;
  const ps = pets.filter((p) => p.ownerId === owner.id);
  const appts = appointments.filter((a) => a.ownerId === owner.id).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const upcoming = appts.filter((a) => new Date(a.startsAt) >= new Date() && a.status !== "cancelled").reverse();
  const past = appts.filter((a) => new Date(a.startsAt) < new Date() || a.status === "cancelled").slice(0, 8);
  const edit = can(role, "edit_clients");

  return (
    <>
      <PageHeader
        title={owner.name}
        lead={`Client since ${formatDate(owner.createdAt, org.timezone)}`}
        actions={
          edit ? (
            <>
              <Pill asChild size="sm" variant="secondary">
                <Link href={`/app/${org.slug}/clients/${owner.id}/edit`}>Edit</Link>
              </Pill>
              <Pill size="sm" onClick={() => setPetOpen(true)}>
                <Plus className="size-4" strokeWidth={1.5} aria-hidden /> Add pet
              </Pill>
            </>
          ) : null
        }
      />
      <NewPetDialog orgSlug={orgSlug} owner={owner.id} open={petOpen} onOpenChange={setPetOpen} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="text-label font-medium text-text-2">Contact</h2>
            <dl className="mt-3 flex flex-col gap-2 text-body">
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Mobile</dt>
                <dd className="tabular">{owner.mobile ?? <span className="text-text-2">Not on file</span>}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Email</dt>
                <dd className="truncate">{owner.email ?? <span className="text-text-2">Not on file</span>}</dd>
              </div>
            </dl>
            {owner.notes ? <p className="mt-3 text-small text-text-2">{owner.notes}</p> : null}
          </Card>
          {can(role, "privacy_requests") ? <PrivacyCard orgSlug={org.slug} owner={owner} petCount={ps.length} appointmentCount={appts.length} /> : null}
          <Card className="p-5">
            <h2 className="text-label font-medium text-text-2">Pets</h2>
            {ps.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {ps.map((p) => (
                  <li key={p.id}>
                    <Row tone="field" href={`/app/${org.slug}/pets/${p.id}`} title={p.name} secondary={`${p.breed}, ${p.sex}`} trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-small text-text-2">No pets on file yet.</p>
            )}
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="text-label font-medium text-text-2">Upcoming</h2>
            {upcoming.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {upcoming.map((a) => {
                  const pet = pets.find((p) => p.id === a.petId);
                  const svc = services.find((s) => s.id === a.serviceId);
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-guide bg-field px-4 py-3">
                      <span className="min-w-0">
                        <span className="block text-body">
                          {pet?.name}, {svc?.name ?? "walk-in"}
                        </span>
                        <span className="block text-small text-text-2 tabular">
                          {formatShortDate(a.startsAt, org.timezone)}, {formatTime(a.startsAt, org.timezone)}, {providers.find((p) => p.id === a.providerId)?.name}
                        </span>
                      </span>
                      <StatusPill status={a.status} size="sm" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-small text-text-2">Nothing booked.</p>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="text-label font-medium text-text-2">History</h2>
            {past.length ? (
              <ul className="mt-3 divide-y divide-divider">
                {past.map((a) => {
                  const pet = pets.find((p) => p.id === a.petId);
                  const svc = services.find((s) => s.id === a.serviceId);
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0 text-small">
                        <span className="tabular text-text-2">{formatShortDate(a.startsAt, org.timezone)}</span> {pet?.name}, {svc?.name ?? "walk-in"}
                      </span>
                      <StatusPill status={a.status} size="sm" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-small text-text-2">No visits yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

const deleteReasons = ["Deletion request from the client", "Duplicate record", "Entered by mistake", "Other"];

// The owner's side of a data request. A copy of everything held, printable,
// and a deletion that takes the pets, appointments and visits with it and
// scrubs the person from the audit trail. Owner role only, and the server
// checks that too.
function PrivacyCard({ orgSlug, owner, petCount, appointmentCount }: { orgSlug: string; owner: Owner; petCount: number; appointmentCount: number }) {
  const router = useRouter();
  const { dispatch } = useOrg();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(deleteReasons[0]);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return (
    <Card className="p-5">
      <h2 className="text-label font-medium text-text-2">Data requests</h2>
      <p className="mt-2 text-small text-text-2">When a client asks what you hold or asks to be forgotten. Both are yours to answer within fifteen days.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill asChild size="sm" variant="secondary">
          <Link href={`/app/${orgSlug}/clients/${owner.id}/export`}>Export a copy</Link>
        </Pill>
        <Pill size="sm" variant="danger" onClick={() => setOpen(true)}>
          Delete this client
        </Pill>
      </div>
      <Frame open={open} onOpenChange={setOpen} title={`Delete ${owner.name}`} description={`Removes the client, ${plural(petCount, "pet")} and ${plural(appointmentCount, "appointment")} with their visits and reminders. Their name comes off the audit trail. This cannot be undone.`}>
        <SelectField label="Reason" value={reason} onChange={setReason} options={deleteReasons.map((r) => ({ value: r, label: r }))} />
        {reason === "Other" ? <TextareaField label="What happened" rows={3} value={other} onChange={(e) => setOther(e.target.value)} /> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Keep the record
          </Pill>
          <Pill
            variant="danger"
            size="sm"
            loading={busy}
            loadingLabel="Deleting"
            onClick={async () => {
              setBusy(true);
              const r = await dispatch({ type: "owner/delete", id: owner.id, reason: reason === "Other" ? other || "Other" : reason });
              setBusy(false);
              if (r.ok) {
                setOpen(false);
                router.push(`/app/${orgSlug}/clients`);
              }
            }}
          >
            Delete client
          </Pill>
        </div>
      </Frame>
    </Card>
  );
}

export function ClientForm({ orgSlug, id, inDialog, onDone }: { orgSlug: string; id?: string; /** Rendered inside a dialog: no page header, and the footer closes instead of navigating. */ inDialog?: boolean; onDone?: (id: string | null) => void }) {
  const router = useRouter();
  const { org, owners, role, dispatch } = useOrg(orgSlug);
  const existing = id ? resolveId(id, owners) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [mobile, setMobile] = useState(existing?.mobile ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  if (!can(role, "edit_clients")) return <NotForRole role={roleLabel[role]} page="Editing clients" />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("A client needs a name.");
      return;
    }
    setBusy(true);
    const r = await dispatch({ type: "owner/upsert", owner: { id: existing?.id, name: name.trim(), mobile: mobile.trim() || undefined, email: email.trim() || undefined, notes: notes.trim() || undefined } });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    const savedId = r.id ?? existing?.id ?? null;
    if (inDialog) return onDone?.(savedId);
    router.push(`/app/${org.slug}/clients/${savedId}`);
  }

  const fields = (
    <>
      <InputField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="off" placeholder="Maria Santos" />
      <InputField label="Mobile" hint="Optional" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" placeholder="0917 555 0142" helper="Reminders are sent to this number by the desk." />
      <InputField label="Email" hint="Optional" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
      <TextareaField label="Notes" hint="Optional" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Prefers Messenger. Usually comes in on Saturdays." />
    </>
  );

  if (inDialog) {
    return (
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {fields}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill type="button" size="sm" variant="secondary" onClick={() => onDone?.(null)}>
            Cancel
          </Pill>
          <Pill type="submit" size="sm" loading={busy} loadingLabel="Saving">
            {existing ? "Save changes" : "Add client"}
          </Pill>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-lg">
      <PageHeader title={existing ? `Edit ${existing.name}` : "New client"} lead={existing ? undefined : "Name is enough to start. Mobile is how reminders reach them."} />
      <Card className="flex flex-col gap-5 p-6">
        {fields}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill asChild size="sm" variant="secondary">
            <Link href={existing ? `/app/${org.slug}/clients/${existing.id}` : `/app/${org.slug}/clients`}>Cancel</Link>
          </Pill>
          <Pill type="submit" size="sm" loading={busy} loadingLabel="Saving">
            {existing ? "Save changes" : "Add client"}
          </Pill>
        </div>
      </Card>
    </form>
  );
}

/** Adding a client is four fields and happens while a phone is ringing, so it
 *  is a dialog over the list rather than a page of its own. The route stays for
 *  anyone who lands on it directly. */
export function NewClientDialog({ orgSlug, open, onOpenChange }: { orgSlug: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { org } = useOrg(orgSlug);
  const toast = useToast();
  return (
    <Frame open={open} onOpenChange={onOpenChange} title="New client" description="Name is enough to start. Mobile is how reminders reach them.">
      <ClientForm
        orgSlug={orgSlug}
        inDialog
        onDone={(id) => {
          onOpenChange(false);
          if (!id) return;
          toast({ title: "Client added", detail: "Add their pet next." });
          router.push(`/app/${org.slug}/clients/${id}`);
        }}
      />
    </Frame>
  );
}
