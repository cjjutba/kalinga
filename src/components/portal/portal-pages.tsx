"use client";

import { placeholder } from "@/content/placeholders";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronRight } from "lucide-react";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card, Row } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { EmptyState } from "@/components/staff/page-header";
import { authClient } from "@/lib/auth-client";
import { dueItems, recallLabel } from "@/lib/domain/recall";
import { ageLabel, speciesLabel, firstName } from "@/lib/domain/selectors";
import type { getPortalData } from "@/lib/db/queries";
import { dueLabel, formatDate, formatLongDate, formatShortDate, formatTime, formatTimeWithZone } from "@/lib/time";

export type PortalData = Awaited<ReturnType<typeof getPortalData>>;

// Five small pages. Sign in by magic link, appointments, one appointment,
// pets, one pet. No staff notes anywhere here. Everything is matched to the
// email the owner signed in with.

export function PortalSignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("The email you gave the clinic when you booked.");
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: err } = await authClient.signIn.magicLink({ email: email.trim(), callbackURL: "/me/appointments", newUserCallbackURL: "/me/appointments" });
    setLoading(false);
    if (err) {
      setError(err.status === 429 ? "Too many attempts. Wait a minute." : "Could not send the link. Try again.");
      return;
    }
    setSent(true);
  }
  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-title font-medium">Check your email</h1>
        <p className="text-small text-text-2">We sent a link to {email} that signs you in. It works for one hour. No password to remember.</p>
        <button type="button" onClick={() => setSent(false)} className="text-left text-small font-medium text-text hover:underline">
          Use a different email
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-medium">Your pets and appointments</h1>
        <p className="mt-2 text-small text-text-2">Enter the email you booked with and we will send a link. No account, no password.</p>
      </div>
      <InputField on="page" label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder={placeholder.email} disabled={loading} />
      <Pill type="submit" block loading={loading} loadingLabel="Sending">
        Send me a link
      </Pill>
      <p className="text-center text-small text-text-2">Booked with a mobile number only? Use the link on your confirmation message to change or cancel.</p>
    </form>
  );
}

function orgOf(data: PortalData, id: string) {
  return data.organisations.find((o) => o.id === id);
}

export function PortalAppointments({ data, name }: { data: PortalData; name: string }) {
  const now = new Date().getTime();
  const upcoming = data.appointments.filter((a) => new Date(a.startsAt).getTime() >= now && a.status !== "cancelled");
  const past = data.appointments.filter((a) => new Date(a.startsAt).getTime() < now || a.status === "cancelled").reverse().slice(0, 10);
  const item = (a: PortalData["appointments"][number]) => {
    const org = orgOf(data, a.organisationId);
    const pet = data.pets.find((p) => p.id === a.petId);
    const svc = data.services.find((s) => s.id === a.serviceId);
    return (
      <li key={a.id}>
        <Row
          href={`/me/appointments/${a.id}`}
          title={
            <>
              {pet?.name}
              <span className="text-text-2">, {svc?.name ?? "visit"}</span>
            </>
          }
          secondary={
            <span className="tabular">
              {formatShortDate(a.startsAt, org?.timezone)}, {formatTime(a.startsAt, org?.timezone)}, {org?.name}
            </span>
          }
          trailing={
            <>
              <StatusPill status={a.status} size="sm" />
              <ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />
            </>
          }
        />
      </li>
    );
  };
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-title font-medium">{name ? `Hi ${firstName(name)}` : "Your appointments"}</h1>
        {data.owners.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="Nothing on file for this email yet" lead="When you book with a clinic on Kalinga using this email, your pets and appointments appear here." />
          </div>
        ) : (
          <>
            <h2 className="mt-5 text-label font-medium text-text-2">Coming up</h2>
            {upcoming.length ? <ul className="mt-2 flex flex-col gap-2">{upcoming.map(item)}</ul> : <div className="mt-2"><EmptyState title="Nothing booked" lead="When something is due, the clinic will message you." action={data.organisations[0] ? <Pill asChild size="sm"><Link href={`/${data.organisations[0].slug}/book`}>Book a visit</Link></Pill> : null} /></div>}
          </>
        )}
      </section>
      {past.length ? (
        <section>
          <h2 className="text-label font-medium text-text-2">Earlier</h2>
          <ul className="mt-2 flex flex-col gap-2">{past.map(item)}</ul>
        </section>
      ) : null}
    </div>
  );
}

export function PortalAppointment({ data, id }: { data: PortalData; id: string }) {
  const appt = data.appointments.find((a) => a.id === id);
  if (!appt) return <EmptyState title="That appointment is not yours to see" lead="Or the link is old." action={<Pill asChild size="sm" variant="secondary"><Link href="/me/appointments">Back</Link></Pill>} />;
  const org = orgOf(data, appt.organisationId);
  const tz = org?.timezone;
  const pet = data.pets.find((p) => p.id === appt.petId);
  const svc = data.services.find((s) => s.id === appt.serviceId);
  const prov = data.providers.find((p) => p.id === appt.providerId);
  const canChange = new Date(appt.startsAt) > new Date() && appt.status !== "cancelled" && appt.status !== "completed";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-medium">
            {pet?.name}
            <span className="text-text-2">, {svc?.name ?? "visit"}</span>
          </h1>
          <p className="mt-1 text-small text-text-2 tabular">
            {formatLongDate(appt.startsAt, tz)}, {formatTimeWithZone(appt.startsAt, tz)}
          </p>
        </div>
        <StatusPill status={appt.status} />
      </div>
      <Card className="p-5">
        <dl className="flex flex-col gap-3 text-body">
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">With</dt>
            <dd className="text-right">{prov?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">Where</dt>
            <dd className="text-right">
              {org?.name}
              <br />
              <span className="text-small text-text-2">{org?.address}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">Reference</dt>
            <dd className="tabular">{appt.reference}</dd>
          </div>
        </dl>
      </Card>
      {canChange && org ? (
        <Pill asChild block variant="secondary">
          <Link href={`/${org.slug}/b/${appt.reference}`}>Change or cancel</Link>
        </Pill>
      ) : null}
      <Link href="/me/appointments" className="text-center text-small font-medium text-text hover:underline">
        Back to appointments
      </Link>
    </div>
  );
}

export function PortalPets({ data }: { data: PortalData }) {
  return (
    <div>
      <h1 className="text-title font-medium">My pets</h1>
      {data.pets.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {data.pets.map((p) => {
            const org = orgOf(data, p.organisationId);
            const due = org ? dueItems(p, org).filter((d) => d.state === "overdue" || d.state === "due") : [];
            return (
              <li key={p.id}>
                <Row
                  href={`/me/pets/${p.id}`}
                  title={
                    <>
                      {p.name}
                      <span className="text-text-2">, {p.breed}</span>
                    </>
                  }
                  secondary={due.length && due[0].dueOn ? `${recallLabel[due[0].kind]} ${dueLabel(due[0].dueOn, org?.timezone)}` : "Nothing due soon"}
                  trailing={
                    <>
                      {due.length ? <StatusPill status={due[0].state === "overdue" ? "overdue" : "due"} size="sm" /> : null}
                      <ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />
                    </>
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5">
          <EmptyState title="No pets on file yet" lead="They appear here after your first booking with this email." />
        </div>
      )}
    </div>
  );
}

export function PortalPet({ data, id }: { data: PortalData; id: string }) {
  const pet = data.pets.find((p) => p.id === id);
  if (!pet) return <EmptyState title="That pet is not on your file" action={<Pill asChild size="sm" variant="secondary"><Link href="/me/pets">Back</Link></Pill>} />;
  const org = orgOf(data, pet.organisationId);
  const tz = org?.timezone;
  const due = org ? dueItems(pet, org) : [];
  const visits = data.visits.filter((v) => v.petId === pet.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-medium">
          {pet.name}
          <span className="text-text-2">, {pet.breed}</span>
        </h1>
        <p className="mt-1 text-small text-text-2">
          {speciesLabel[pet.species]}, {pet.sex}
          {pet.birthDate ? `, ${ageLabel(pet.birthDate, tz ?? "Asia/Manila")}` : ""}
          {pet.weightKg ? `, ${pet.weightKg} kg at the last visit` : ""}
        </p>
      </div>
      <Card className="p-5">
        <h2 className="text-label font-medium text-text-2">Due next</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {due.map((d) => (
            <li key={d.kind} className="flex items-center justify-between gap-3 rounded-guide bg-field px-4 py-3">
              <span>
                <span className="block text-body font-medium">{recallLabel[d.kind]}</span>
                <span className="block text-small text-text-2">{d.dueOn ? `Around ${formatDate(d.dueOn, tz)}` : "The clinic will tell you"}</span>
              </span>
              {d.state === "overdue" ? <StatusPill status="overdue" size="sm" /> : d.state === "due" ? <StatusPill status="due" size="sm" /> : null}
            </li>
          ))}
        </ul>
        {org ? (
          <Pill asChild block size="sm" className="mt-4">
            <Link href={`/${org.slug}/book`}>Book a visit</Link>
          </Pill>
        ) : null}
      </Card>
      <Card className="p-5">
        <h2 className="text-label font-medium text-text-2">Visits</h2>
        {visits.length ? (
          <ul className="mt-3 divide-y divide-divider">
            {visits.map((v) => {
              const appt = data.appointments.find((a) => a.id === v.appointmentId);
              const svc = appt ? data.services.find((s) => s.id === appt.serviceId) : undefined;
              return (
                <li key={v.id} className="flex items-baseline justify-between gap-3 py-2.5 text-small">
                  <span>
                    <span className="font-medium">{svc?.name ?? "Visit"}</span>
                    {v.administered.length ? <span className="text-text-2">, {v.administered.join(", ")}</span> : null}
                  </span>
                  <span className="tabular text-text-2">{formatShortDate(v.at, tz)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-small text-text-2">No visits yet.</p>
        )}
      </Card>
    </div>
  );
}
