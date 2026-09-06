"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { SlotPicker, type Slot } from "./slot-picker";
import type { PublicClinic } from "./clinic-page";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { getPublicSlots } from "@/lib/actions/slots";
import { bookAppointment } from "@/lib/actions/public";
import { formatLongDate, formatPeso, formatTimeWithZone, zoneLabel } from "@/lib/time";
import { cn } from "@/lib/utils";

// The page a pet owner actually uses. Five steps: service, vet or any, slot,
// details, review. It is the last thing between someone and a commitment, so
// it has to feel certain at any width.
//
// One panel, two shapes. On a laptop the steps stand in a rail down the left
// with their state on them, and the content sits beside it. On a phone the
// rail lies down as segments across the top. Either way the buttons are under
// the content, not stuck to the bottom of the window, and a step already
// passed can be returned to by clicking it.

type Step = 0 | 1 | 2 | 3 | 4;

const steps = [
  { name: "Service", lead: "What your pet needs" },
  { name: "Vet", lead: "Anyone, or a name" },
  { name: "Time", lead: "Day and time" },
  { name: "Your details", lead: "Name and contact" },
  { name: "Review", lead: "Check and confirm" },
];

const mobileRe = /^\d[\d\s]{9,12}$/;

export function BookingFlow({ data }: { data: PublicClinic }) {
  const router = useRouter();
  const { organisation: org, services, providers } = data;
  const tz = org.timezone;

  const [step, setStep] = useState<Step>(0);
  const [seen, setSeen] = useState<Step>(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [providerId, setProviderId] = useState<string>("any");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [details, setDetails] = useState({ name: "", mobile: "", email: "", petName: "", species: "dog", notes: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [slotError, setSlotError] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const service = services.find((s) => s.id === serviceId);
  const eligible = useMemo(() => providers.filter((p) => (service?.recallKind === "grooming" ? p.title === "Groomer" : p.title === "Vet")), [providers, service?.recallKind]);
  const pool = eligible.length ? eligible : providers;
  const filtered = pool.length < providers.length;

  const load = useCallback(
    (from: Date, days: number) => getPublicSlots({ orgSlug: org.slug, serviceId, providerId: providerId === "any" ? "any" : providerId, from: from.toISOString(), days }),
    [org.slug, serviceId, providerId],
  );

  // The clinic needs a way to reach whoever booked, so both are asked for.
  const detailErrors = () => {
    const e: Record<string, string | undefined> = {};
    if (!details.name.trim()) e.name = "We need a name for the booking.";
    if (!mobileRe.test(details.mobile.trim())) e.mobile = "A Philippine mobile number, like 0917 555 0142.";
    if (!details.email.trim()) e.email = "The clinic sends your confirmation here.";
    else if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(details.email.trim())) e.email = "That email does not look right.";
    if (!details.petName.trim()) e.petName = "What is your pet called?";
    return e;
  };
  const detailsDone = Object.values(detailErrors()).every((v) => !v);

  const go = (to: Step) => {
    setStep(to);
    setSeen((s) => (to > s ? to : s));
  };

  // Back is always allowed. Forward only over ground already covered, and only
  // while the answers that got there still hold.
  const reachable = (i: number) => {
    if (i <= step) return true;
    if (i > seen) return false;
    if (i >= 1 && !serviceId) return false;
    if (i >= 3 && !slot) return false;
    if (i >= 4 && !detailsDone) return false;
    return true;
  };

  const next = () => {
    if (step === 0 && !serviceId) return;
    if (step === 2 && !slot) return;
    if (step === 3) {
      const e = detailErrors();
      setErrors(e);
      if (Object.values(e).some(Boolean)) return;
    }
    go(Math.min(4, step + 1) as Step);
  };

  const confirm = async () => {
    if (!service || !slot) return;
    setSubmitting(true);
    const result = await bookAppointment({
      orgSlug: org.slug,
      serviceId: service.id,
      providerId: slot.providerId,
      startsAt: slot.startsAt,
      name: details.name.trim(),
      mobile: details.mobile.trim(),
      email: details.email.trim(),
      petName: details.petName.trim(),
      species: details.species,
      notes: details.notes.trim(),
      website: details.website,
    });
    if (!result.ok) {
      setSubmitting(false);
      if (result.code === "limited") return setLimited(true);
      setSlotError(result.error);
      setSlot(null);
      go(2);
      return;
    }
    router.push(`/${org.slug}/b/${result.reference}${result.emailed ? "?emailed=1" : ""}`);
  };

  if (limited) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center gap-4 px-5 py-12">
        <h1 className="text-title font-medium">Too many bookings from this connection</h1>
        <p className="text-body text-text-2">
          To protect the clinic&apos;s calendar we pause after several bookings in a row. Try again in a few minutes{org.mobile ? <>, or call {org.name} on <span className="tabular">{org.mobile}</span></> : null}.
        </p>
        <Pill asChild block variant="secondary">
          <Link href={`/${org.slug}`}>Back to the clinic</Link>
        </Pill>
      </main>
    );
  }

  const back = () => (step === 0 ? router.push(`/${org.slug}`) : go((step - 1) as Step));

  const choice = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-card px-4 py-4 text-left transition-colors duration-150 motion-reduce:transition-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
      selected ? "bg-action text-on-action" : "bg-page text-text hover:bg-divider/70 lg:bg-field lg:hover:bg-divider",
    );

  return (
    // Three grounds, one inside the next. The window is the page tone, the
    // shell holding the rail and the panel is the sheet tone a step in from
    // it, and the panel comes back to the page tone, so it reads as cut out of
    // the shell with a hairline round it and an even edge on every side. No
    // shadows anywhere: the tones do the separating, as everywhere else.
    //
    // The panel's height is fixed, so a long step scrolls inside it and the
    // shell never grows or shrinks between steps.
    <div className="min-h-dvh bg-page lg:flex lg:items-center lg:justify-center lg:p-6">
      <div className="min-h-dvh w-full bg-sheet p-2 lg:min-h-0 lg:max-w-[1240px] lg:rounded-sheet">
        <div className="lg:flex lg:h-[44rem]">
          <aside className="hidden w-[320px] shrink-0 flex-col p-8 lg:flex print:hidden">
          <div>
            <p className="text-body font-medium">{org.name}</p>
            {org.city ? <p className="mt-0.5 text-label text-text-2">{org.city}</p> : null}
          </div>
          <ol className="mt-9 flex flex-col gap-6">
            {steps.map((s, i) => {
              const done = i < step;
              const current = i === step;
              const can = reachable(i) && i !== step;
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => can && go(i as Step)}
                    disabled={!can}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-input text-left transition-opacity duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-page",
                      can && "hover:opacity-70",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-medium",
                        done ? "bg-action text-on-action" : current ? "text-text ring-1 ring-text" : "text-text-3 ring-1 ring-divider",
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={2} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-small font-medium leading-tight", current || done ? "text-text" : "text-text-2")}>{s.name}</span>
                      <span className="mt-1 block text-label leading-tight text-text-2">{s.lead}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-8">
            <Link href={`/${org.slug}`} className="rounded-tag text-label text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              Back to the clinic
            </Link>
            <Link href="/privacy" className="rounded-tag text-label text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              Privacy
            </Link>
          </div>
        </aside>

          {/* Below the rail's width there is no panel either: the step sits on
              the page. From the rail up it becomes the card the rail points at.
              Content starts at the top of it, never centred, so a step with
              two choices and a step with a form begin on the same line and
              nothing jumps between them. */}
          <main className="flex justify-center px-3 py-6 lg:flex-1 lg:overflow-hidden lg:rounded-card lg:border lg:border-divider lg:bg-page lg:px-4 lg:py-10">
          <div className="flex w-full max-w-md flex-col gap-8 lg:h-full lg:min-h-0">
            {/* Everything above the buttons scrolls; the buttons do not, so a
                long step never hides the way forward. */}
            <div className="flex flex-col gap-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1">
            <div className="flex flex-col gap-4 lg:hidden">
              <button
                type="button"
                onClick={back}
                aria-label={step === 0 ? "Back to the clinic" : `Back to ${steps[step - 1]?.name.toLowerCase()}`}
                className="grid size-8 shrink-0 place-items-center rounded-full text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <ArrowLeft className="size-[18px]" strokeWidth={2} />
              </button>
              <ol className="flex gap-2" aria-label="Booking steps">
                {steps.map((s, i) => {
                  const can = reachable(i) && i !== step;
                  return (
                    <li key={s.name} className="flex-1">
                      <button
                        type="button"
                        onClick={() => can && go(i as Step)}
                        disabled={!can}
                        aria-current={i === step ? "step" : undefined}
                        aria-label={`Step ${i + 1}, ${s.name}${i < step ? ", done" : i === step ? ", current" : ", not yet"}`}
                        className={cn(
                          "h-0.5 w-full rounded-full transition-colors duration-150 motion-reduce:transition-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-page",
                          i <= step ? "bg-action" : "bg-divider",
                        )}
                      />
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="flex flex-col gap-8">
              {step === 0 ? (
                <>
                  <Title heading="What does your pet need?" lead={`One visit, one service. ${org.name} can add anything else on the day.`} />
                  <div role="radiogroup" aria-label="Service" className="flex flex-col gap-2">
                    {services.map((s) => (
                      <button key={s.id} type="button" role="radio" aria-checked={serviceId === s.id} onClick={() => { setServiceId(s.id); setSlot(null); }} className={choice(serviceId === s.id)}>
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
                  <Title
                    heading="Who would you like to see?"
                    lead={filtered ? (service?.recallKind === "grooming" ? "Grooming is done by the groomers." : `${service?.name} is done by the vets.`) : "Anyone available, or someone in particular."}
                  />
                  <div role="radiogroup" aria-label="Vet" className="flex flex-col gap-2">
                    {[{ id: "any", name: "Any available", title: "Soonest slot wins" }, ...pool.map((p) => ({ id: p.id, name: p.name, title: p.title }))].map((p) => (
                      <button key={p.id} type="button" role="radio" aria-checked={providerId === p.id} onClick={() => { setProviderId(p.id); setSlot(null); }} className={choice(providerId === p.id)}>
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
                  <Title heading="When suits you?" lead={`Times are clinic time, ${zoneLabel(tz)}. ${service?.name}, ${service?.durationMin} minutes.`} />
                  {slotError ? (
                    <div role="alert" className="rounded-guide bg-page p-4 lg:bg-field">
                      <p className="text-body font-medium">That slot was just taken</p>
                      <p className="mt-1 text-small text-text-2">{slotError} Nothing was saved.</p>
                    </div>
                  ) : null}
                  {service ? (
                    <SlotPicker on="shell" tz={tz} load={load} value={slot} onChange={(s) => { setSlot(s); setSlotError(null); }} who={providerId === "any" ? "Any available" : pool.find((p) => p.id === providerId)?.name ?? ""} reloadKey={`${serviceId}:${providerId}`} />
                  ) : null}
                </>
              ) : step === 3 ? (
                <>
                  <Title heading="Who is coming?" lead="So the clinic can confirm this and remind you when your pet is due again." />
                  <div className="flex flex-col gap-5">
                    <InputField on="shell" label="Your name" autoComplete="name" value={details.name} onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))} error={errors.name} />
                    <InputField on="shell" label="Mobile" inputMode="tel" autoComplete="tel" placeholder="0917 555 0142" value={details.mobile} onChange={(e) => setDetails((d) => ({ ...d, mobile: e.target.value }))} error={errors.mobile} helper="The clinic confirms and reminds you here." />
                    <InputField on="shell" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={details.email} onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))} error={errors.email} helper="Your confirmation arrives here." />
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <InputField on="shell" label="Pet's name" value={details.petName} onChange={(e) => setDetails((d) => ({ ...d, petName: e.target.value }))} error={errors.petName} />
                      <SelectField on="shell" label="Species" value={details.species} onChange={(v) => setDetails((d) => ({ ...d, species: v }))} options={[{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }]} className="w-32" />
                    </div>
                    <TextareaField on="shell" label="Anything the vet should know" hint="Optional" rows={3} value={details.notes} onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))} />
                    <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                      <label>
                        Website <input tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => setDetails((d) => ({ ...d, website: e.target.value }))} />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Title heading="Check and confirm" lead="Nothing is booked until you press the button." />
                  <Card className="bg-page p-5 lg:bg-field">
                    <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-small">
                      <dt className="text-text-2">Service</dt>
                      <dd>
                        {service?.name}, {formatPeso(service?.pricePhp ?? 0)}
                      </dd>
                      <dt className="text-text-2">When</dt>
                      <dd className="tabular">
                        {slot ? formatLongDate(slot.startsAt, tz) : ""}
                        <br />
                        {slot ? formatTimeWithZone(slot.startsAt, tz) : ""}
                      </dd>
                      <dt className="text-text-2">With</dt>
                      <dd>{providers.find((p) => p.id === slot?.providerId)?.name ?? "Any available"}</dd>
                      {org.address ? (
                        <>
                          <dt className="text-text-2">Where</dt>
                          <dd>{org.address}</dd>
                        </>
                      ) : null}
                      <dt className="text-text-2">For</dt>
                      <dd>
                        {details.petName}, {details.species}
                      </dd>
                      <dt className="text-text-2">You</dt>
                      <dd className="min-w-0">
                        {details.name}
                        <br />
                        <span className="tabular">{details.mobile}</span>
                        <br />
                        <span className="break-all">{details.email}</span>
                      </dd>
                    </dl>
                  </Card>
                  <p className="-mt-4 text-small text-text-2">
                    Pay at the clinic, cash or GCash. You can change or cancel from the link on your confirmation. By booking you agree to the{" "}
                    <Link href="/privacy" className="font-medium text-text hover:underline">
                      privacy notice
                    </Link>
                    .
                  </p>
                </>
              )}

            </div>
            </div>

            {/* Both buttons together at the left, back first and the way
                forward beside it, so the pair reads in the order it is used
                and neither drifts to the far edge of the panel. */}
            <div className="flex flex-wrap items-center gap-3 lg:px-1">
                {step > 0 ? (
                  <Pill variant="secondary" onClick={back}>
                    Back
                  </Pill>
                ) : null}
                {step < 4 ? (
                  <Pill onClick={next} disabled={(step === 0 && !serviceId) || (step === 2 && !slot)}>
                    {step === 2 && slot ? `Book ${formatTimeWithZone(slot.startsAt, tz)}` : "Continue"}
                  </Pill>
                ) : (
                  <Pill onClick={confirm} loading={submitting} loadingLabel="Booking">
                    Confirm booking
                  </Pill>
                )}
            </div>
          </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** The heading and its one line, the same shape on every step. */
function Title({ heading, lead }: { heading: string; lead?: string }) {
  return (
    <div>
      <h1 className="text-title font-medium text-balance">{heading}</h1>
      {lead ? <p className="mt-1.5 text-small text-text-2">{lead}</p> : null}
    </div>
  );
}
