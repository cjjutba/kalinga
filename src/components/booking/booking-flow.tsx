"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SlotPicker } from "./slot-picker";
import { ClinicNotFound } from "./clinic-page";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/mock/store";
import type { Slot } from "@/lib/mock/slots";
import type { Provider } from "@/lib/mock/types";
import { formatLongDate, formatPeso, formatTimeWithZone, zoneLabel } from "@/lib/time";
import { useUiState } from "@/lib/use-ui-state";
import { cn } from "@/lib/utils";

// The page a pet owner actually uses. Five steps, one hand, thumb reach.
// Service, vet or any, slot, details, review. It is the last step before a
// commitment, so it has to feel certain. ?state= forces the states that
// decide whether it is any good: full, empty, race, limited, loading.

type Step = 0 | 1 | 2 | 3 | 4;
const stepNames = ["Service", "Vet", "Time", "Your details", "Review"];

export function BookingFlow({ slug }: { slug: string }) {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const ui = useUiState<"full" | "empty" | "race" | "limited" | "loading">();
  const org = state.organisations.find((o) => o.slug === slug);
  const services = useMemo(() => state.services.filter((s) => s.organisationId === org?.id && s.publiclyBookable), [state.services, org?.id]);
  const providers = useMemo(() => state.providers.filter((p) => p.organisationId === org?.id), [state.providers, org?.id]);

  const [step, setStep] = useState<Step>(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [providerId, setProviderId] = useState<string>("any");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [details, setDetails] = useState({ name: "", mobile: "", email: "", petName: "", species: "dog", notes: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [raceError, setRaceError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const orgId = org?.id ?? "";
  const service = services.find((s) => s.id === serviceId);

  // Forced states shape the data the picker sees rather than the picker itself.
  const appointmentsForPicker = useMemo(() => {
    const base = state.appointments.filter((a) => a.organisationId === orgId);
    if (ui !== "full") return base;
    // Every slot taken for a week: block each provider's whole day with one long appointment.
    const blockers = [];
    for (let d = 0; d < 7; d++) {
      for (const p of providers) {
        const day = new Date();
        day.setUTCDate(day.getUTCDate() + d);
        const start = new Date(day.toISOString().slice(0, 10) + "T00:00:00.000Z");
        blockers.push({ id: `block_${d}_${p.id}`, organisationId: orgId, reference: "BLOCK", ownerId: "", petId: "", serviceId: null, providerId: p.id, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 24 * 3600_000).toISOString(), status: "confirmed" as const, source: "staff" as const, createdAt: start.toISOString() });
      }
    }
    return [...base, ...blockers];
  }, [state.appointments, orgId, providers, ui]);

  const providersForPicker: Provider[] = useMemo(() => {
    const pool = providerId === "any" ? providers.filter((p) => (service?.recallKind === "grooming" ? p.title === "Groomer" : p.title === "Vet")) : providers.filter((p) => p.id === providerId);
    if (ui !== "empty") return pool.length ? pool : providers;
    // Next three days closed for everyone.
    const closed = Array.from({ length: 3 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return { date: d.toISOString().slice(0, 10), reason: "Fiesta, clinic closed" };
    });
    return (pool.length ? pool : providers).map((p) => ({ ...p, exceptions: [...p.exceptions, ...closed] }));
  }, [providers, providerId, service?.recallKind, ui]);

  if (!org) return <ClinicNotFound />;
  const tz = org.timezone;

  const next = () => {
    if (step === 0 && !serviceId) return;
    if (step === 2 && !slot) return;
    if (step === 3) {
      const e: Record<string, string | undefined> = {};
      if (!details.name.trim()) e.name = "We need a name for the booking.";
      if (!/^\d[\d\s]{9,12}$/.test(details.mobile.trim())) e.mobile = "A Philippine mobile number, like 0917 555 0142.";
      if (details.email && !details.email.includes("@")) e.email = "That email does not look right.";
      if (!details.petName.trim()) e.petName = "What is your pet called?";
      setErrors(e);
      if (Object.values(e).some(Boolean)) return;
    }
    setStep((s) => Math.min(4, s + 1) as Step);
  };

  const confirm = () => {
    if (!service || !slot || details.website) return;
    if (ui === "race" && !raceError) {
      setRaceError(true);
      setStep(2);
      setSlot(null);
      return;
    }
    setSubmitting(true);
    const ownerId = `own_${Date.now().toString(36)}`;
    const petId = `pet_${Date.now().toString(36)}`;
    dispatch({ type: "org/set", orgId: org.id });
    dispatch({ type: "owner/upsert", owner: { id: ownerId, name: details.name.trim(), mobile: details.mobile.trim(), email: details.email.trim() || undefined, notes: details.notes.trim() || undefined } });
    dispatch({ type: "pet/upsert", pet: { id: petId, ownerId, name: details.petName.trim(), species: details.species as "dog" | "cat", breed: details.species === "dog" ? "Aspin" : "Puspin", sex: "male", birthDate: new Date().toISOString().slice(0, 10) } });
    const provider = slot.providerId ?? (providerId === "any" ? providersForPicker[0]?.id : providerId);
    dispatch({
      type: "appointment/create",
      appointment: { organisationId: org.id, ownerId, petId, serviceId: service.id, providerId: provider!, startsAt: slot.startsAt, endsAt: slot.endsAt, status: "booked", source: "online", note: details.notes.trim() || undefined },
    });
    window.setTimeout(() => router.push(`/${org.slug}/b/latest`), 600);
  };

  if (ui === "limited") {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center gap-4 px-5 py-12">
        <h1 className="text-title font-medium">Too many bookings from this connection</h1>
        <p className="text-body text-text-2">To protect the clinic&apos;s calendar we pause after several bookings in a row. Try again in a few minutes, or call {org.name} on <span className="tabular">{org.mobile}</span>.</p>
        <Pill asChild block variant="secondary">
          <Link href={`/${org.slug}`}>Back to the clinic</Link>
        </Pill>
      </main>
    );
  }

  const progress = ((step + 1) / stepNames.length) * 100;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="sticky top-0 z-10 bg-page/95 px-5 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => (step === 0 ? router.push(`/${org.slug}`) : setStep((s) => Math.max(0, s - 1) as Step))} className="inline-flex h-10 items-center gap-1 rounded-full pr-3 text-small font-medium text-text hover:bg-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label={step === 0 ? "Back to the clinic" : "Back"}>
            <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden /> Back
          </button>
          <p className="text-label text-text-2">
            {org.name}. Step {step + 1} of {stepNames.length}
          </p>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-sheet" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Booking progress">
          <div className="h-full bg-action transition-[width] duration-250 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex-1 px-5 pb-32 pt-6">
        {ui === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy>
            <Skeleton className="h-8 w-2/3 rounded-tag bg-sheet" />
            <Skeleton className="h-4 w-1/2 rounded-tag bg-sheet" />
            <Skeleton className="h-16 rounded-guide bg-sheet" />
            <Skeleton className="h-16 rounded-guide bg-sheet" />
            <Skeleton className="h-16 rounded-guide bg-sheet" />
            <p className="text-label text-text-2">Waking the clinic&apos;s calendar. A few seconds on the first visit.</p>
          </div>
        ) : step === 0 ? (
          <>
            <h1 className="text-title font-medium">What does your pet need?</h1>
            <div role="radiogroup" aria-label="Service" className="mt-5 flex flex-col gap-2">
              {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={serviceId === s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setSlot(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-card px-4 py-4 text-left transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                      serviceId === s.id ? "bg-action text-on-action" : "bg-sheet text-text hover:bg-divider/60",
                    )}
                  >
                    <span>
                      <span className="block text-body font-medium">{s.name}</span>
                      <span className={cn("block text-small", serviceId === s.id ? "text-on-action/80" : "text-text-2")}>{s.durationMin} minutes</span>
                    </span>
                    <span className="text-body tabular">{formatPeso(s.pricePhp)}</span>
                  </button>
              ))}
            </div>
          </>
        ) : step === 1 ? (
          <>
            <h1 className="text-title font-medium">Who would you like to see?</h1>
            <div role="radiogroup" aria-label="Vet" className="mt-5 flex flex-col gap-2">
              {[{ id: "any", name: "Any available", title: "Soonest slot wins" }, ...providers.filter((p) => (service?.recallKind === "grooming" ? p.title === "Groomer" : p.title === "Vet")).map((p) => ({ id: p.id, name: p.name, title: p.title }))].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={providerId === p.id}
                    onClick={() => {
                      setProviderId(p.id);
                      setSlot(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-card px-4 py-4 text-left transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                      providerId === p.id ? "bg-action text-on-action" : "bg-sheet text-text hover:bg-divider/60",
                    )}
                  >
                    <span>
                      <span className="block text-body font-medium">{p.name}</span>
                      <span className={cn("block text-small", providerId === p.id ? "text-on-action/80" : "text-text-2")}>{p.title}</span>
                    </span>
                  </button>
              ))}
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h1 className="text-title font-medium">When suits you?</h1>
            <p className="mt-1 text-small text-text-2">
              Times are clinic time, {zoneLabel(tz)}. {service?.name}, {service?.durationMin} minutes.
            </p>
            {raceError ? (
              <div role="alert" className="mt-4 rounded-guide bg-field p-4">
                <p className="text-body font-medium">That slot was just taken</p>
                <p className="mt-1 text-small text-text-2">Someone booked it while you were typing. Nothing was charged and nothing was saved. Pick another time.</p>
              </div>
            ) : null}
            {service ? (
              <div className="mt-5">
                <SlotPicker tz={tz} providers={providersForPicker} service={service} appointments={appointmentsForPicker} value={slot} onChange={setSlot} />
              </div>
            ) : null}
          </>
        ) : step === 3 ? (
          <>
            <h1 className="text-title font-medium">Who is coming?</h1>
            <div className="mt-5 flex flex-col gap-5">
              <InputField on="page" label="Your name" autoComplete="name" value={details.name} onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))} error={errors.name} />
              <InputField on="page" label="Mobile" inputMode="tel" autoComplete="tel" placeholder="0917 555 0142" value={details.mobile} onChange={(e) => setDetails((d) => ({ ...d, mobile: e.target.value }))} error={errors.mobile} helper="The clinic confirms and reminds you on this number." />
              <InputField on="page" label="Email" hint="Optional" type="email" autoComplete="email" value={details.email} onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))} error={errors.email} />
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <InputField on="page" label="Pet's name" value={details.petName} onChange={(e) => setDetails((d) => ({ ...d, petName: e.target.value }))} error={errors.petName} />
                <SelectField on="page" label="Species" value={details.species} onChange={(v) => setDetails((d) => ({ ...d, species: v }))} options={[{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }]} className="w-28" />
              </div>
              <TextareaField on="page" label="Anything the vet should know" hint="Optional" rows={3} value={details.notes} onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))} />
              {/* Honeypot. Real people never see it and never fill it. */}
              <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                <label>
                  Website <input tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => setDetails((d) => ({ ...d, website: e.target.value }))} />
                </label>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-title font-medium">Check and confirm</h1>
            <Card className="mt-5 p-5">
              <dl className="flex flex-col gap-3 text-body">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-2">Service</dt>
                  <dd className="text-right">
                    {service?.name}, {formatPeso(service?.pricePhp ?? 0)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-2">When</dt>
                  <dd className="text-right tabular">
                    {slot ? formatLongDate(slot.startsAt, tz) : ""}
                    <br />
                    {slot ? formatTimeWithZone(slot.startsAt, tz) : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-2">With</dt>
                  <dd className="text-right">{providers.find((p) => p.id === (slot?.providerId ?? providerId))?.name ?? "Any available vet"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-2">For</dt>
                  <dd className="text-right">
                    {details.petName}, {details.species}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-2">You</dt>
                  <dd className="text-right">
                    {details.name}
                    <br />
                    <span className="tabular">{details.mobile}</span>
                  </dd>
                </div>
              </dl>
            </Card>
            <p className="mt-4 text-small text-text-2">
              Pay at the clinic, cash or GCash. You can change or cancel from the link on your confirmation. By booking you agree to the{" "}
              <Link href="/privacy" className="font-medium text-text hover:underline">
                privacy notice
              </Link>
              .
            </p>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-page/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <span className="text-small text-text-2">{stepNames[step]}</span>
          {step < 4 ? (
            <Pill onClick={next} disabled={(step === 0 && !serviceId) || (step === 2 && !slot) || ui === "loading"} className="min-w-40">
              {step === 2 && slot ? `Book ${formatTimeWithZone(slot.startsAt, tz)}` : "Continue"}
            </Pill>
          ) : (
            <Pill onClick={confirm} loading={submitting} loadingLabel="Booking" className="min-w-40">
              Confirm booking
            </Pill>
          )}
        </div>
      </div>
    </main>
  );
}
