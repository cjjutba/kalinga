"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { usePortalOwner } from "./portal-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card, Row } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { EmptyState } from "@/components/staff/page-header";
import { dueItems, recallLabel } from "@/lib/mock/recall";
import { ageLabel, speciesLabel } from "@/lib/mock/selectors";
import { dueLabel, formatDate, formatLongDate, formatShortDate, formatTime, formatTimeWithZone } from "@/lib/time";
import { useUiState } from "@/lib/use-ui-state";

// Five small pages. Sign in by magic link, appointments, one appointment,
// pets, one pet. No staff notes anywhere here.

export function PortalSignIn() {
  const router = useRouter();
  const ui = useUiState<"sent">();
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(ui === "sent");
  const [error, setError] = useState<string | undefined>();
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError("The mobile or email you booked with.");
      return;
    }
    setError(undefined);
    setSent(true);
    router.replace("/me?state=sent");
  }
  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-guide bg-sheet p-4">
          <p className="text-small font-medium">Sandbox. Nothing is sent.</p>
          <p className="mt-1 text-small text-text-2">In the demo the link appears here instead of in your messages.</p>
          <Row className="mt-3 bg-field px-3 py-2.5" title={<span className="text-small font-medium">Open my Kalinga</span>} trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} onClick={() => router.push("/me/appointments")} />
        </div>
        <h1 className="text-title font-medium">Check your messages</h1>
        <p className="text-small text-text-2">We sent a link that signs you in. It works for one hour. No password to remember.</p>
        <button type="button" onClick={() => setSent(false)} className="text-left text-small font-medium text-text hover:underline">
          Use a different number or email
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-medium">Your pets and appointments</h1>
        <p className="mt-2 text-small text-text-2">Enter the mobile or email you booked with and we will send a link. No account, no password.</p>
      </div>
      <InputField on="page" label="Mobile or email" value={value} onChange={(e) => setValue(e.target.value)} error={error} placeholder="0917 555 0142" autoComplete="username" />
      <Pill type="submit" block>
        Send me a link
      </Pill>
      <p className="text-center text-small text-text-2">
        Booking for the first time?{" "}
        <Link href="/lunhaw" className="font-medium text-text hover:underline">
          Find your clinic&apos;s page
        </Link>
      </p>
    </form>
  );
}

export function PortalAppointments() {
  const { owner, org, state } = usePortalOwner();
  const ui = useUiState<"empty">();
  const tz = org.timezone;
  const all = ui === "empty" ? [] : state.appointments.filter((a) => a.ownerId === owner?.id);
  const upcoming = all.filter((a) => new Date(a.startsAt) >= new Date() && a.status !== "cancelled").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = all.filter((a) => new Date(a.startsAt) < new Date() || a.status === "cancelled").sort((a, b) => b.startsAt.localeCompare(a.startsAt)).slice(0, 10);
  const item = (a: (typeof all)[number]) => {
    const pet = state.pets.find((p) => p.id === a.petId);
    const svc = state.services.find((s) => s.id === a.serviceId);
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
          secondary={<span className="tabular">{formatShortDate(a.startsAt, tz)}, {formatTime(a.startsAt, tz)}, {org.name}</span>}
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
        <h1 className="text-title font-medium">Hi {owner?.name.split(" ")[0]}</h1>
        <h2 className="mt-5 text-label font-medium text-text-2">Coming up</h2>
        {upcoming.length ? (
          <ul className="mt-2 flex flex-col gap-2">{upcoming.map(item)}</ul>
        ) : (
          <div className="mt-2">
            <EmptyState title="Nothing booked" lead="When something is due, the clinic will message you." action={<Pill asChild size="sm"><Link href={`/${org.slug}/book`}>Book a visit</Link></Pill>} />
          </div>
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

export function PortalAppointment({ id }: { id: string }) {
  const { owner, org, state } = usePortalOwner();
  const mine = state.appointments.filter((a) => a.ownerId === owner?.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const appt = id === "first" ? mine.find((a) => new Date(a.startsAt) >= new Date() && a.status !== "cancelled") ?? mine[0] : mine.find((a) => a.id === id);
  if (!appt) return <EmptyState title="That appointment is not yours to see" lead="Or the link is old." action={<Pill asChild size="sm" variant="secondary"><Link href="/me/appointments">Back</Link></Pill>} />;
  const tz = org.timezone;
  const pet = state.pets.find((p) => p.id === appt.petId);
  const svc = state.services.find((s) => s.id === appt.serviceId);
  const prov = state.providers.find((p) => p.id === appt.providerId);
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
              {org.name}
              <br />
              <span className="text-small text-text-2">{org.address}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-2">Reference</dt>
            <dd className="tabular">{appt.reference}</dd>
          </div>
        </dl>
      </Card>
      {canChange ? (
        <div className="flex flex-col gap-2">
          <Pill asChild block variant="secondary">
            <Link href={`/${org.slug}/b/${appt.reference}`}>Change or cancel</Link>
          </Pill>
        </div>
      ) : null}
      <Link href="/me/appointments" className="text-center text-small font-medium text-text hover:underline">
        Back to appointments
      </Link>
    </div>
  );
}

export function PortalPets() {
  const { owner, org, state } = usePortalOwner();
  const pets = state.pets.filter((p) => p.ownerId === owner?.id);
  return (
    <div>
      <h1 className="text-title font-medium">My pets</h1>
      {pets.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {pets.map((p) => {
            const due = dueItems(p, org).filter((d) => d.state === "overdue" || d.state === "due");
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
                  secondary={due.length ? `${recallLabel[due[0].kind]} ${dueLabel(due[0].dueOn!, org.timezone)}` : "Nothing due soon"}
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
          <EmptyState title="No pets on file yet" lead="They appear here after your first booking." />
        </div>
      )}
    </div>
  );
}

export function PortalPet({ id }: { id: string }) {
  const { owner, org, state } = usePortalOwner();
  const pets = state.pets.filter((p) => p.ownerId === owner?.id);
  const pet = id === "first" ? pets[0] : pets.find((p) => p.id === id);
  if (!pet) return <EmptyState title="That pet is not on your file" action={<Pill asChild size="sm" variant="secondary"><Link href="/me/pets">Back</Link></Pill>} />;
  const tz = org.timezone;
  const due = dueItems(pet, org);
  const visits = state.visits.filter((v) => v.petId === pet.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-medium">
          {pet.name}
          <span className="text-text-2">, {pet.breed}</span>
        </h1>
        <p className="mt-1 text-small text-text-2">
          {speciesLabel[pet.species]}, {pet.sex}, {ageLabel(pet.birthDate, tz)}
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
        <Pill asChild block size="sm" className="mt-4">
          <Link href={`/${org.slug}/book`}>Book a visit</Link>
        </Pill>
      </Card>
      <Card className="p-5">
        <h2 className="text-label font-medium text-text-2">Visits</h2>
        {visits.length ? (
          <ul className="mt-3 divide-y divide-divider">
            {visits.map((v) => {
              const appt = state.appointments.find((a) => a.id === v.appointmentId);
              const svc = appt ? state.services.find((s) => s.id === appt.serviceId) : undefined;
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
