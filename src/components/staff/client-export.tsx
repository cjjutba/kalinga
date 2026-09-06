"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { PageHeader, EmptyState, NotForRole } from "./page-header";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { useOrg } from "@/lib/org-data";
import { can, roleLabel } from "@/lib/roles";
import { formatDate, formatShortDate, formatTime } from "@/lib/time";
import { speciesLabel } from "@/lib/domain/selectors";
import type { Owner } from "@/lib/domain/types";

// The answer to "what do you hold about me". Everything the clinic keeps on
// one client and their animals, laid out to be printed or saved as a PDF and
// handed over. Owner role only, and the page guard on the server says the
// same. Nothing here is fetched: it is the same snapshot the shell already
// holds, which is the point, because that is exactly what the clinic holds.

function resolve(id: string, owners: Owner[]): Owner | undefined {
  return owners.find((o) => o.id === id);
}

const statusWords: Record<string, string> = {
  booked: "Booked",
  confirmed: "Confirmed",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Did not arrive",
};

const kindWords: Record<string, string> = { vaccination: "Vaccination", deworming: "Deworming", grooming: "Grooming" };

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right">{value === undefined || value === null || value === "" ? <span className="text-text-2">Not on file</span> : value}</dd>
    </div>
  );
}

export function ClientExport({ orgSlug, id }: { orgSlug: string; id: string }) {
  const { org, owners, pets, appointments, visits, reminders, services, providers, role } = useOrg(orgSlug);
  if (!can(role, "privacy_requests")) return <NotForRole role={roleLabel[role]} page="Data export" />;
  const owner = resolve(id, owners);
  if (!owner) return <EmptyState title="That client is not on file" lead="They may have been removed, or the link is old." action={<Pill asChild size="sm" variant="secondary"><Link href={`/app/${orgSlug}/clients`}>Back to clients</Link></Pill>} />;

  const tz = org.timezone;
  const ps = pets.filter((p) => p.ownerId === owner.id);
  const appts = appointments.filter((a) => a.ownerId === owner.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const serviceName = (sid: string | null) => services.find((s) => s.id === sid)?.name ?? "Walk-in";
  const providerName = (pid: string) => providers.find((p) => p.id === pid)?.name ?? "Staff";
  const generated = new Date().toISOString();

  return (
    <article className="mx-auto max-w-3xl print:max-w-none print:text-black">
      <PageHeader
        title={`Everything on file for ${owner.name}`}
        lead={`${org.name}. Prepared ${formatDate(generated, tz)} for a data request under the Data Privacy Act.`}
        className="print:mb-4"
        actions={
          <div className="flex gap-2 print:hidden">
            <Pill asChild size="sm" variant="secondary">
              <Link href={`/app/${orgSlug}/clients/${owner.id}`}>Back to client</Link>
            </Pill>
            <Pill size="sm" onClick={() => window.print()}>
              <Printer className="size-4" strokeWidth={1.5} aria-hidden /> Print
            </Pill>
          </div>
        }
      />

      <div className="flex flex-col gap-4 print:gap-6">
        <Card className="p-5 print:bg-transparent print:p-0">
          <h2 className="text-label font-medium text-text-2">Contact</h2>
          <dl className="mt-2 divide-y divide-divider text-body">
            <Field label="Name" value={owner.name} />
            <Field label="Mobile" value={owner.mobile} />
            <Field label="Email" value={owner.email} />
            <Field label="Client since" value={formatDate(owner.createdAt, tz)} />
            <Field label="Notes from the desk" value={owner.notes} />
          </dl>
        </Card>

        {ps.length === 0 ? (
          <Card className="p-5 print:bg-transparent print:p-0">
            <p className="text-small text-text-2">No animals on file.</p>
          </Card>
        ) : null}

        {ps.map((p) => {
          const pa = appts.filter((a) => a.petId === p.id);
          const pv = visits.filter((v) => v.petId === p.id).sort((a, b) => a.at.localeCompare(b.at));
          const pr = reminders.filter((r) => r.petId === p.id).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
          return (
            <Card key={p.id} className="p-5 print:break-inside-avoid print:bg-transparent print:p-0">
              <h2 className="text-heading font-medium">
                {p.name}
                <span className="text-text-2">, {p.breed}</span>
              </h2>
              <dl className="mt-2 divide-y divide-divider text-body">
                <Field label="Species" value={speciesLabel[p.species]} />
                <Field label="Sex" value={p.sex} />
                <Field label="Birth date" value={p.birthDate ? formatDate(p.birthDate, tz) : undefined} />
                <Field label="Last recorded weight" value={p.weightKg ? `${p.weightKg} kg` : undefined} />
                <Field label="Last vaccination" value={p.lastVaccination ? formatDate(p.lastVaccination, tz) : undefined} />
                <Field label="Last deworming" value={p.lastDeworming ? formatDate(p.lastDeworming, tz) : undefined} />
                <Field label="Last groom" value={p.lastGroom ? formatDate(p.lastGroom, tz) : undefined} />
                <Field label="Notes" value={p.notes} />
              </dl>

              <h3 className="mt-5 text-label font-medium text-text-2">Appointments</h3>
              {pa.length ? (
                <ul className="mt-2 divide-y divide-divider text-small">
                  {pa.map((a) => (
                    <li key={a.id} className="py-2">
                      <span className="tabular">{formatShortDate(a.startsAt, tz)}, {formatTime(a.startsAt, tz)}</span>. {serviceName(a.serviceId)} with {providerName(a.providerId)}. {statusWords[a.status] ?? a.status}. Reference {a.reference}, booked {a.source === "online" ? "online" : "at the desk"}.
                      {a.note ? <span className="block text-text-2">Note: {a.note}</span> : null}
                      {a.cancelReason ? <span className="block text-text-2">Cancelled: {a.cancelReason}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-small text-text-2">None.</p>
              )}

              <h3 className="mt-5 text-label font-medium text-text-2">Visits</h3>
              {pv.length ? (
                <ul className="mt-2 divide-y divide-divider text-small">
                  {pv.map((v) => (
                    <li key={v.id} className="py-2">
                      <span className="tabular">{formatDate(v.at, tz)}</span>. Seen by {providerName(v.providerId)}.{v.weightKg ? ` ${v.weightKg} kg.` : ""}
                      {v.administered.length ? ` Given: ${v.administered.join(", ")}.` : ""}
                      {v.paymentMethod ? ` Paid by ${v.paymentMethod === "gcash" ? "GCash" : "cash"}${v.paymentRef ? `, reference ${v.paymentRef}` : ""}.` : ""}
                      {v.notes ? <span className="block text-text-2">Vet&apos;s note: {v.notes}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-small text-text-2">None.</p>
              )}

              <h3 className="mt-5 text-label font-medium text-text-2">Reminders prepared</h3>
              {pr.length ? (
                <ul className="mt-2 divide-y divide-divider text-small">
                  {pr.map((r) => (
                    <li key={r.id} className="py-2">
                      <span className="tabular">{formatShortDate(r.dueOn, tz)}</span>. {kindWords[r.kind] ?? r.kind} due. {r.sentAt ? `Sent ${formatShortDate(r.sentAt, tz)}.` : "Not sent."}
                      <span className="block text-text-2">{r.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-small text-text-2">None in the last two months.</p>
              )}
            </Card>
          );
        })}

        <p className="text-small text-text-2 print:mt-6">
          This is everything {org.name} holds about this client in Kalinga. It does not include staff accounts, other clients, or the clinic&apos;s own settings. Reminders older than two months are not listed. To have this record deleted, ask the clinic or use the request form at kalinga.cjjutba.dev/privacy/request.
        </p>
      </div>
    </article>
  );
}
