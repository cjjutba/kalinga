"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { SteppedShell, StepTitle } from "@/components/primitives/stepped";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Lockup } from "@/components/primitives/lockup";
import { useConfirm } from "@/components/primitives/confirm";
import { placeholder } from "@/content/placeholders";
import { applyAction } from "@/lib/actions/apply";
import type { StoreAction } from "@/lib/actions/types";
import type { RecallKind } from "@/lib/domain/types";
import { authClient } from "@/lib/auth-client";
import { roleLabel, staffRoles, type Role } from "@/lib/roles";
import { reservedSlugs, slugify } from "@/lib/slug";
import { clinicNow, formatDate, formatPeso, formatTime } from "@/lib/time";
import { controlOn } from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";

// Setting a clinic up, in the same frame a pet owner books in. Seven steps,
// six of them optional, and each one writes as it goes: what is added here is
// on file before the next step, so leaving halfway leaves a real clinic with
// real rows rather than a draft nobody can use.
//
// The order is the order the work depends on. The clinic has to exist before
// anything can belong to it. Services and people come next, because a booking
// needs both. Hours attach to people, closures attach to hours, and recall is
// the only thing that can be set on the first day and left alone for a year.

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const steps = [
  { name: "Clinic", lead: "Name and booking link" },
  { name: "Services", lead: "What can be booked" },
  { name: "Staff", lead: "Who sees the animals" },
  { name: "Hours", lead: "When you are open" },
  { name: "Closures", lead: "Days you shut" },
  { name: "Recall", lead: "When a pet is due" },
  { name: "Ready", lead: "Share your link" },
];

const zones = [
  { value: "Asia/Manila", label: "Asia/Manila" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
];

const recallOptions = [
  { value: "", label: "No recall" },
  { value: "vaccination", label: "Vaccination" },
  { value: "deworming", label: "Deworming" },
  { value: "grooming", label: "Grooming" },
];

// Clicking one fills the form. Nothing is written until the clinic presses
// Add, and the price is always theirs to type: this product never invents a
// number and calls it the clinic's.
const common: { name: string; durationMin: number; recallKind: RecallKind | "" }[] = [
  { name: "Consultation", durationMin: 20, recallKind: "" },
  { name: "Vaccination", durationMin: 30, recallKind: "vaccination" },
  { name: "Deworming", durationMin: 15, recallKind: "deworming" },
  { name: "Grooming", durationMin: 60, recallKind: "grooming" },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AddedService = { id: string; name: string; durationMin: number; pricePhp: number; recallKind: RecallKind | "" };
type AddedProvider = { id: string; name: string; title: "Vet" | "Groomer" };
type SentInvite = { id: string; email: string; role: Role; message?: string };
type Closure = { date: string; reason: string };

export function Onboarding({ hasClinics }: { hasClinics: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();

  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);

  // Step one, and the thing everything else waits on.
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState("");
  const [tz, setTz] = useState("Asia/Manila");
  const [nameError, setNameError] = useState<string | undefined>();
  const [slugError, setSlugError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [now, setNow] = useState<string | null>(null);
  /** Set once the clinic is on file. Everything after step one needs it. */
  const [created, setCreated] = useState<string | null>(null);

  const [services, setServices] = useState<AddedService[]>([]);
  const [providers, setProviders] = useState<AddedProvider[]>([]);
  const [invites, setInvites] = useState<SentInvite[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [openFrom, setOpenFrom] = useState("09:00");
  const [openTo, setOpenTo] = useState("18:00");
  const [recall, setRecall] = useState({ vaccination: "12", deworming: "3", grooming: "5" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => setNow(formatTime(clinicNow(tz), tz));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tz]);

  useEffect(() => {
    if (!slug || reservedSlugs.has(slug) || created) return;
    const handle = window.setTimeout(async () => {
      const { error } = await authClient.organization.checkSlug({ slug });
      setSlugError(error ? `${slug} is taken. Try ${slug}-${city ? slugify(city).slice(0, 6) : "clinic"}.` : undefined);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [slug, city, created]);

  const send = async (action: StoreAction) => {
    if (!created) return { ok: false as const, error: "The clinic is not on file yet" };
    return applyAction(created, action);
  };

  const go = (to: number) => setStep(Math.max(0, Math.min(6, to)) as Step);
  const back = () => (step === 0 ? router.push(hasClinics ? "/app" : "/") : go(step - 1));

  // Only the first step gates anything. After it, every step is optional and
  // the rail is open, because a clinic that wants to add services on Thursday
  // should not have to walk past hours and closures to reach them.
  const reachable = (i: number) => i === 0 || Boolean(created);

  async function saveClinic() {
    let bad = false;
    if (!name.trim()) {
      setNameError("Give the clinic its name as pet owners know it.");
      bad = true;
    } else setNameError(undefined);
    if (!slug) {
      setSlugError("Choose a booking address.");
      bad = true;
    } else if (reservedSlugs.has(slug)) {
      setSlugError(`${slug} is reserved. Try ${slug}-clinic.`);
      bad = true;
    }
    if (bad || slugError) return;
    setBusy(true);
    setFormError(undefined);

    if (created) {
      // Coming back to change the name or the city. The address is the one
      // thing that cannot move, so it is not offered again.
      const r = await applyAction(created, { type: "org/update", changes: { name: name.trim(), city: city.trim(), timezone: tz } });
      setBusy(false);
      if (!r.ok) return setFormError(r.error);
      return go(1);
    }

    const { data, error } = await authClient.organization.create({ name: name.trim(), slug });
    if (error || !data) {
      setBusy(false);
      return setFormError(error?.message ?? "Could not create the clinic.");
    }
    await authClient.organization.setActive({ organizationId: data.id });
    await applyAction(data.slug, { type: "org/update", changes: { timezone: tz, city: city.trim() || undefined } });
    setCreated(data.slug);
    setBusy(false);
    go(1);
  }

  async function saveHours() {
    setBusy(true);
    const weeklyHours = [...days].sort((a, b) => a - b).map((day) => ({ day, from: openFrom, to: openTo }));
    await send({ type: "org/update", changes: { openFrom, openTo } });
    for (const p of providers) {
      await send({ type: "provider/upsert", provider: { id: p.id, name: p.name, title: p.title, weeklyHours } });
    }
    setBusy(false);
    go(4);
  }

  async function saveRecall() {
    setBusy(true);
    const whole = (v: string, lo: number, hi: number, fallback: number) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || fallback));
    await send({
      type: "org/update",
      changes: {
        vaccinationIntervalMonths: whole(recall.vaccination, 1, 36, 12),
        dewormingIntervalMonths: whole(recall.deworming, 1, 24, 3),
        groomingIntervalWeeks: whole(recall.grooming, 2, 12, 5),
      },
    });
    setBusy(false);
    go(6);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://kalinga.cjjutba.dev/${created}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const primary = () => {
    if (step === 0) return saveClinic();
    if (step === 3) return saveHours();
    if (step === 5) return saveRecall();
    if (step === 6) {
      setBusy(true);
      router.push(`/app/${created}`);
      router.refresh();
      return;
    }
    go(step + 1);
  };

  const primaryLabel = step === 6 ? "Open the clinic" : step === 0 && !created ? "Create clinic" : "Continue";
  const busyLabel = step === 0 ? "Creating" : step === 6 ? "Opening" : "Saving";

  return (
    <SteppedShell
      steps={steps}
      step={step}
      onStep={go}
      reachable={reachable}
      stepsLabel="Setup steps"
      onBack={back}
      backLabel={step === 0 ? "Leave setup" : `Back to ${steps[step - 1]?.name.toLowerCase()}`}
      head={
        <div>
          <Lockup href="/" size="sm" />
          <p className="mt-4 text-label text-text-2">{created ? "Everything after this is optional." : "Setting up your clinic."}</p>
        </div>
      }
      railFooter={
        <>
          {created ? (
            <Link href={`/app/${created}`} className="rounded-tag text-label text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              Finish later
            </Link>
          ) : null}
          <Link href="/privacy" className="rounded-tag text-label text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            Privacy
          </Link>
        </>
      }
      actions={
        <>
          {step > 0 ? (
            <Pill variant="secondary" onClick={() => go(step - 1)} disabled={busy}>
              Back
            </Pill>
          ) : null}
          <Pill onClick={primary} loading={busy} loadingLabel={busyLabel}>
            {primaryLabel}
          </Pill>
        </>
      }
    >
      {step === 0 ? (
        <>
          <StepTitle heading="Set up your clinic" lead="The name and the link are what pet owners see. Everything after this can wait." />
          {formError ? (
            <p role="alert" className="text-small text-error">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-col gap-5">
            <InputField
              on="shell"
              label="Clinic name"
              name="clinic"
              placeholder={placeholder.clinicName}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched && !created) setSlug(slugify(e.target.value));
              }}
              error={nameError}
              disabled={busy}
              autoFocus
            />
            <InputField
              on="shell"
              label="Booking address"
              name="slug"
              prefix="kalinga.cjjutba.dev/"
              placeholder={placeholder.bookingAddress}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              helper={created ? "This is the link you share with pet owners. It cannot be changed." : "This is the link you share with pet owners. It cannot be changed later."}
              error={slugError}
              disabled={busy || Boolean(created)}
              autoCapitalize="off"
              spellCheck={false}
            />
            <InputField on="shell" label="City" hint="Optional" name="city" placeholder={placeholder.city} value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} />
            <SelectField on="shell" label="Time zone" value={tz} onChange={setTz} options={zones} helper={now ? `It is ${now} there right now.` : "Appointments show in this zone, labelled."} disabled={busy} />
          </div>
        </>
      ) : step === 1 ? (
        <>
          <StepTitle heading="What can be booked?" lead="Consultation, vaccination, deworming and grooming are the usual four. One is enough to open the booking page." />
          <ServiceStep
            services={services}
            onAdd={async (s) => {
              const r = await send({ type: "service/upsert", service: { name: s.name, durationMin: s.durationMin, bufferMin: 0, pricePhp: s.pricePhp, publiclyBookable: true, recallKind: s.recallKind || undefined } });
              if (!r.ok || !r.id) return r.ok ? "Could not add that service." : r.error;
              setServices((list) => [...list, { ...s, id: r.id as string }]);
              return null;
            }}
            onRemove={(s) =>
              confirm({
                title: `Remove ${s.name}?`,
                description: "It disappears from your booking page. You can add it again under Settings.",
                confirmLabel: "Remove it",
                busyLabel: "Removing",
                run: async () => {
                  const r = await send({ type: "service/archive", id: s.id });
                  if (r.ok) setServices((list) => list.filter((x) => x.id !== s.id));
                  return r.ok;
                },
              })
            }
          />
        </>
      ) : step === 2 ? (
        <>
          <StepTitle heading="Who sees the animals?" lead="Vets and groomers hold the schedule. Invitations are for the people who sign in." />
          <StaffStep
            providers={providers}
            invites={invites}
            onAddProvider={async (p) => {
              const r = await send({ type: "provider/upsert", provider: { name: p.name, title: p.title } });
              if (!r.ok || !r.id) return r.ok ? "Could not add that person." : r.error;
              setProviders((list) => [...list, { ...p, id: r.id as string }]);
              return null;
            }}
            onRemoveProvider={(p) =>
              confirm({
                title: `Remove ${p.name} from the schedule?`,
                description: "Their hours stop being offered. You can add them again under Settings.",
                confirmLabel: "Remove them",
                busyLabel: "Removing",
                run: async () => {
                  const r = await send({ type: "provider/archive", id: p.id });
                  if (r.ok) setProviders((list) => list.filter((x) => x.id !== p.id));
                  return r.ok;
                },
              })
            }
            onInvite={async (email, role) => {
              const r = await send({ type: "member/invite", member: { email, role } });
              if (!r.ok || !r.id) return r.ok ? "Could not send that invitation." : r.error;
              setInvites((list) => [...list, { id: r.id as string, email, role, message: r.message }]);
              return null;
            }}
          />
        </>
      ) : step === 3 ? (
        <>
          <StepTitle heading="When are you open?" lead={providers.length ? "These hours go to everyone you just added. Per person changes live under Settings." : "Add a vet or groomer first and these hours attach to them."} />
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-small font-medium">Days</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {dayNames.map((d, i) => {
                  const on = days.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDays((list) => (on ? list.filter((x) => x !== i) : [...list, i]))}
                      className={cn(
                        "h-10 min-w-[3.25rem] rounded-full px-3 text-small font-medium transition-colors duration-150 motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                        on ? "bg-action text-on-action" : cn(controlOn.shell, "text-text-2 hover:text-text"),
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField on="shell" label="Opens" type="time" value={openFrom} onChange={(e) => setOpenFrom(e.target.value)} disabled={busy} />
              <InputField on="shell" label="Closes" type="time" value={openTo} onChange={(e) => setOpenTo(e.target.value)} disabled={busy} />
            </div>
            <p className="text-small text-text-2">
              {days.length === 0 ? "No days selected, so nothing is bookable yet." : `Open ${days.length === 7 ? "every day" : [...days].sort((a, b) => a - b).map((d) => dayNames[d]).join(", ")}, ${openFrom} to ${openTo}.`}
            </p>
          </div>
        </>
      ) : step === 4 ? (
        <>
          <StepTitle heading="Any days you are shut?" lead="Holidays, fiestas, stocktake. The slot picker will not offer them. You can add more any time." />
          <ClosureStep
            closures={closures}
            disabled={providers.length === 0}
            onAdd={async (c) => {
              for (const p of providers) {
                const r = await send({ type: "provider/upsert", provider: { id: p.id, name: p.name, title: p.title, exceptions: [...closures, c].map((x) => ({ date: x.date, reason: x.reason })) } });
                if (!r.ok) return r.error;
              }
              setClosures((list) => [...list, c]);
              return null;
            }}
            onRemove={(c) =>
              confirm({
                title: "Remove this closure?",
                description: "That day opens for booking again.",
                confirmLabel: "Remove it",
                busyLabel: "Removing",
                run: async () => {
                  const next = closures.filter((x) => x.date !== c.date);
                  for (const p of providers) {
                    const r = await send({ type: "provider/upsert", provider: { id: p.id, name: p.name, title: p.title, exceptions: next } });
                    if (!r.ok) return false;
                  }
                  setClosures(next);
                  return true;
                },
              })
            }
          />
        </>
      ) : step === 5 ? (
        <>
          <StepTitle heading="When is a pet due again?" lead="This is the part that earns. Kalinga counts from the last visit and tells the desk who to call." />
          <div className="flex flex-col gap-5">
            <InputField on="shell" label="Vaccination, every" inputMode="numeric" placeholder={placeholder.months} value={recall.vaccination} onChange={(e) => setRecall((r) => ({ ...r, vaccination: e.target.value }))} helper="Months. Twelve is the usual annual booster." disabled={busy} />
            <InputField on="shell" label="Deworming, every" inputMode="numeric" placeholder={placeholder.months} value={recall.deworming} onChange={(e) => setRecall((r) => ({ ...r, deworming: e.target.value }))} helper="Months. Three for an adult, one for a puppy." disabled={busy} />
            <InputField on="shell" label="Grooming, every" inputMode="numeric" placeholder={placeholder.weeks} value={recall.grooming} onChange={(e) => setRecall((r) => ({ ...r, grooming: e.target.value }))} helper="Weeks. Four to six is usual." disabled={busy} />
          </div>
        </>
      ) : (
        <>
          <StepTitle heading={`${name.trim() || "Your clinic"} is ready.`} lead="Share the link and the bookings arrive in your day. Anything you skipped is waiting under Settings." />
          <div className="flex flex-col gap-5">
            <div className={cn("rounded-card p-5", controlOn.shell)}>
              <p className="text-body font-medium">Your booking link</p>
              <p className="mt-0.5 text-small text-text-2">Put it on your Facebook page. Pet owners book on it without an account.</p>
              <div className="mt-3 flex items-center gap-2 rounded-guide bg-page p-2 pl-4">
                <span className="min-w-0 flex-1 truncate text-small tabular text-text-2">kalinga.cjjutba.dev/{created}</span>
                <button type="button" onClick={copyLink} aria-label={copied ? "Booking link copied" : "Copy booking link"} className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  {copied ? <Check className="size-5" strokeWidth={1.5} /> : <Copy className="size-5" strokeWidth={1.5} />}
                </button>
                <a href={`/${created}`} target="_blank" rel="noreferrer" aria-label="Open the booking page in a new tab" className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  <ExternalLink className="size-5" strokeWidth={1.5} />
                </a>
              </div>
            </div>
            <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2.5 text-small">
              <dt className="text-text-2">Services</dt>
              <dd>{services.length ? services.map((s) => s.name).join(", ") : "None yet"}</dd>
              <dt className="text-text-2">On the schedule</dt>
              <dd>{providers.length ? providers.map((p) => p.name).join(", ") : "Nobody yet"}</dd>
              <dt className="text-text-2">Invited</dt>
              <dd>{invites.length ? invites.map((i) => i.email).join(", ") : "Nobody yet"}</dd>
              <dt className="text-text-2">Open</dt>
              <dd>{days.length ? `${days.length === 7 ? "Every day" : [...days].sort((a, b) => a - b).map((d) => dayNames[d]).join(", ")}, ${openFrom} to ${openTo}` : "No days set"}</dd>
            </dl>
          </div>
        </>
      )}
    </SteppedShell>
  );
}

/** A list of what a step has already put on file, with a way to undo each. */
function Added({ children }: { children: ReactNode }) {
  return <ul className={cn("flex flex-col divide-y divide-divider overflow-hidden rounded-card", controlOn.shell)}>{children}</ul>;
}

function AddedRow({ title, detail, onRemove, removeLabel }: { title: string; detail: string; onRemove: () => void; removeLabel: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium">{title}</span>
        <span className="block truncate text-small text-text-2">{detail}</span>
      </span>
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-status-noshow hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <Trash2 className="size-4" strokeWidth={1.5} />
      </button>
    </li>
  );
}

function ServiceStep({ services, onAdd, onRemove }: { services: AddedService[]; onAdd: (s: Omit<AddedService, "id">) => Promise<string | null>; onRemove: (s: AddedService) => void }) {
  const [form, setForm] = useState<{ name: string; minutes: string; price: string; recallKind: RecallKind | "" }>({ name: "", minutes: "30", price: "", recallKind: "" });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("What do you call it?");
    const minutes = Math.round(Number(form.minutes));
    if (!minutes || minutes < 5) return setError("How long does it take, in minutes?");
    setError(undefined);
    setBusy(true);
    const failed = await onAdd({ name: form.name.trim(), durationMin: Math.min(480, minutes), pricePhp: Math.max(0, Math.round(Number(form.price) || 0)), recallKind: form.recallKind });
    setBusy(false);
    if (failed) return setError(failed);
    setForm({ name: "", minutes: "30", price: "", recallKind: "" });
  }

  return (
    <div className="flex flex-col gap-5">
      {services.length ? (
        <Added>
          {services.map((s) => (
            <AddedRow key={s.id} title={s.name} detail={`${s.durationMin} minutes, ${formatPeso(s.pricePhp)}${s.recallKind ? `, sets ${s.recallKind} recall` : ""}`} onRemove={() => onRemove(s)} removeLabel={`Remove ${s.name}`} />
          ))}
        </Added>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {common.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setForm((f) => ({ ...f, name: c.name, minutes: String(c.durationMin), recallKind: c.recallKind }))}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-small text-text-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none", controlOn.shell, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page")}
          >
            <Plus className="size-3.5" strokeWidth={1.5} aria-hidden /> {c.name}
          </button>
        ))}
      </div>

      <form onSubmit={add} noValidate className="flex flex-col gap-5">
        <InputField on="shell" label="Service" placeholder={placeholder.serviceName} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={error} disabled={busy} />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField on="shell" label="Minutes" inputMode="numeric" placeholder={placeholder.minutes} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} disabled={busy} />
          <InputField on="shell" label="Price" prefix="₱" inputMode="numeric" placeholder={placeholder.price} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} disabled={busy} />
        </div>
        <SelectField on="shell" label="Sets a recall" value={form.recallKind} onChange={(v) => setForm((f) => ({ ...f, recallKind: v as RecallKind | "" }))} options={recallOptions} helper="Kalinga counts from this visit to the next one due." disabled={busy} />
        <div>
          <Pill type="submit" size="sm" variant="secondary" loading={busy} loadingLabel="Adding">
            Add service
          </Pill>
        </div>
      </form>
    </div>
  );
}

function StaffStep({
  providers,
  invites,
  onAddProvider,
  onRemoveProvider,
  onInvite,
}: {
  providers: AddedProvider[];
  invites: SentInvite[];
  onAddProvider: (p: Omit<AddedProvider, "id">) => Promise<string | null>;
  onRemoveProvider: (p: AddedProvider) => void;
  onInvite: (email: string, role: Role) => Promise<string | null>;
}) {
  const [person, setPerson] = useState({ name: "", title: "Vet" as AddedProvider["title"] });
  const [personError, setPersonError] = useState<string | undefined>();
  const [addingPerson, setAddingPerson] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "front_desk" as Role });
  const [inviteError, setInviteError] = useState<string | undefined>();
  const [inviting, setInviting] = useState(false);

  async function addPerson(e: FormEvent) {
    e.preventDefault();
    if (!person.name.trim()) return setPersonError("The name as it appears on your booking page.");
    setPersonError(undefined);
    setAddingPerson(true);
    const failed = await onAddProvider({ name: person.name.trim(), title: person.title });
    setAddingPerson(false);
    if (failed) return setPersonError(failed);
    setPerson({ name: "", title: "Vet" });
  }

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    if (!invite.email.includes("@")) return setInviteError("A real email, so the invitation has somewhere to go.");
    setInviteError(undefined);
    setInviting(true);
    const failed = await onInvite(invite.email.trim(), invite.role);
    setInviting(false);
    if (failed) return setInviteError(failed);
    setInvite({ email: "", role: "front_desk" });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <h2 className="text-body font-medium">Vets and groomers</h2>
        {providers.length ? (
          <Added>
            {providers.map((p) => (
              <AddedRow key={p.id} title={p.name} detail={p.title === "Groomer" ? "Groomer, takes grooming only" : "Vet"} onRemove={() => onRemoveProvider(p)} removeLabel={`Remove ${p.name}`} />
            ))}
          </Added>
        ) : null}
        <form onSubmit={addPerson} noValidate className="flex flex-col gap-5">
          <InputField on="shell" label="Name" placeholder={placeholder.personName} value={person.name} onChange={(e) => setPerson((p) => ({ ...p, name: e.target.value }))} error={personError} disabled={addingPerson} />
          <SelectField on="shell" label="Role on the schedule" value={person.title} onChange={(v) => setPerson((p) => ({ ...p, title: v as AddedProvider["title"] }))} options={[{ value: "Vet", label: "Vet" }, { value: "Groomer", label: "Groomer" }]} disabled={addingPerson} />
          <div>
            <Pill type="submit" size="sm" variant="secondary" loading={addingPerson} loadingLabel="Adding">
              Add to schedule
            </Pill>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-body font-medium">Invite people to sign in</h2>
          <p className="mt-0.5 text-small text-text-2">They get a link that works for seven days. You can do this later.</p>
        </div>
        {invites.length ? (
          <Added>
            {invites.map((i) => (
              <li key={i.id} className="px-4 py-3">
                <p className="truncate text-body">{i.email}</p>
                <p className="text-small text-text-2">{roleLabel[i.role]}, invited</p>
                {i.message && i.message !== "Invitation sent" ? <p className="mt-1 break-all text-label text-text-2">{i.message}</p> : null}
              </li>
            ))}
          </Added>
        ) : null}
        <form onSubmit={sendInvite} noValidate className="flex flex-col gap-5">
          <InputField on="shell" label="Email" type="email" placeholder={placeholder.contactEmail} value={invite.email} onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} error={inviteError} disabled={inviting} />
          <SelectField on="shell" label="Role" value={invite.role} onChange={(v) => setInvite((i) => ({ ...i, role: v as Role }))} options={staffRoles.map((r) => ({ value: r, label: roleLabel[r] }))} disabled={inviting} />
          <div>
            <Pill type="submit" size="sm" variant="secondary" loading={inviting} loadingLabel="Inviting">
              Send invitation
            </Pill>
          </div>
        </form>
      </section>
    </div>
  );
}

function ClosureStep({ closures, disabled, onAdd, onRemove }: { closures: Closure[]; disabled: boolean; onAdd: (c: Closure) => Promise<string | null>; onRemove: (c: Closure) => void }) {
  const [form, setForm] = useState({ date: "", reason: "" });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.date) return setError("Pick the date.");
    if (closures.some((c) => c.date === form.date)) return setError("That day is already closed.");
    setError(undefined);
    setBusy(true);
    const failed = await onAdd({ date: form.date, reason: form.reason.trim() || "Closed" });
    setBusy(false);
    if (failed) return setError(failed);
    setForm({ date: "", reason: "" });
  }

  return (
    <div className="flex flex-col gap-5">
      {closures.length ? (
        <Added>
          {closures.map((c) => (
            <AddedRow key={c.date} title={formatDate(c.date)} detail={c.reason} onRemove={() => onRemove(c)} removeLabel={`Remove the closure on ${c.date}`} />
          ))}
        </Added>
      ) : null}
      {disabled ? (
        <p className="text-small text-text-2">A closure belongs to the people who hold the schedule. Add a vet or groomer first, then come back.</p>
      ) : (
        <form onSubmit={add} noValidate className="flex flex-col gap-5">
          <InputField on="shell" label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} error={error} disabled={busy} />
          <InputField on="shell" label="Reason" hint="Optional" placeholder={placeholder.closureReason} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} disabled={busy} />
          <div>
            <Pill type="submit" size="sm" variant="secondary" loading={busy} loadingLabel="Adding">
              Add closure
            </Pill>
          </div>
        </form>
      )}
    </div>
  );
}
