"use client";

import { placeholder } from "@/content/placeholders";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, ListChecks, UserPlus } from "lucide-react";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { authClient } from "@/lib/auth-client";
import { applyAction } from "@/lib/actions/apply";
import { clinicNow, formatTime } from "@/lib/time";

// Three fields and the clinic exists. The slug is the link the clinic shares,
// so the taken state matters more than usual and is checked as you type.
//
// Two shapes, one form. A first clinic gets the whole page at /new, with the
// preview of what pet owners will see. A second one is a dialog inside the
// staff shell, because by then the person has a clinic open and does not need
// taking out of it.

const reserved = new Set(["app", "me", "api", "design", "sign-in", "sign-up", "reset", "new", "invite", "privacy", "demo", "kalinga", "admin", "www"]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

const zones = [
  { value: "Asia/Manila", label: "Asia/Manila" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
];

export function ClinicForm({ inDialog, onDone, onBusyChange }: { inDialog?: boolean; onDone?: (slug: string | null) => void; /** Lets the dialog around this form keep itself open while it saves. */ onBusyChange?: (busy: boolean) => void } = {}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState("");
  const [tz, setTz] = useState("Asia/Manila");
  const [slugError, setSlugError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(formatTime(clinicNow(tz), tz));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tz]);

  // Check the slug as it settles, so the taken state shows before submit.
  useEffect(() => {
    if (!slug || reserved.has(slug)) return;
    const handle = window.setTimeout(async () => {
      const { error } = await authClient.organization.checkSlug({ slug });
      setSlugError(error ? `${slug} is taken. Try ${slug}-${city ? slugify(city).slice(0, 6) : "clinic"}.` : undefined);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [slug, city]);

  function onName(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    let bad = false;
    if (!name.trim()) {
      setNameError("Give the clinic its name as pet owners know it.");
      bad = true;
    } else setNameError(undefined);
    if (!slug) {
      setSlugError("Choose a booking address.");
      bad = true;
    } else if (reserved.has(slug)) {
      setSlugError(`${slug} is reserved. Try ${slug}-clinic.`);
      bad = true;
    }
    if (bad || slugError) return;
    setLoading(true);
    onBusyChange?.(true);
    setFormError(undefined);
    const { data, error } = await authClient.organization.create({ name: name.trim(), slug });
    if (error || !data) {
      setLoading(false);
      onBusyChange?.(false);
      setFormError(error?.message ?? "Could not create the clinic.");
      return;
    }
    await authClient.organization.setActive({ organizationId: data.id });
    await applyAction(data.slug, { type: "org/update", changes: { timezone: tz, city: city.trim() || undefined } });
    if (inDialog) return onDone?.(data.slug);
    router.push(`/app/${data.slug}`);
    router.refresh();
  }

  const previewName = name.trim() || "Your clinic";
  const previewCity = city.trim() || "Your city";
  const previewSlug = slug || "your-clinic";

  const fields = (
    <>
      {formError ? (
        <p role="alert" className="text-small text-error">
          {formError}
        </p>
      ) : null}
      <InputField label="Clinic name" name="clinic" placeholder={placeholder.clinicName} value={name} onChange={(e) => onName(e.target.value)} error={nameError} disabled={loading} autoFocus />
      <InputField
        label="Booking address"
        name="slug"
        prefix="kalinga.cjjutba.dev/"
        placeholder={placeholder.bookingAddress}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(slugify(e.target.value));
        }}
        helper="This is the link you share with pet owners. It cannot be changed later."
        error={slugError}
        disabled={loading}
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="City" hint="Optional" name="city" placeholder={placeholder.city} value={city} onChange={(e) => setCity(e.target.value)} disabled={loading} />
        <SelectField label="Time zone" value={tz} onChange={setTz} options={zones} helper={now ? `It is ${now} there right now.` : "Appointments show in this zone, labelled."} disabled={loading} />
      </div>
    </>
  );

  if (inDialog) {
    return (
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {fields}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill type="button" size="sm" variant="secondary" onClick={() => onDone?.(null)} disabled={loading}>
            Cancel
          </Pill>
          <Pill type="submit" size="sm" loading={loading} loadingLabel="Creating">
            Create clinic
          </Pill>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div className="min-w-0">
        <h1 className="text-title font-medium text-balance">Set up your clinic</h1>
        <p className="mt-2 max-w-md text-small text-text-2">Three fields and you can take a booking. Services, hours and staff come next, inside.</p>

        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5 rounded-card bg-sheet p-5 md:p-6">
          {fields}
          <Pill type="submit" block loading={loading} loadingLabel="Creating clinic">
            Create clinic
          </Pill>
        </form>
        <p className="mt-3 text-[13px] text-text-2">The name, city and time zone can change later. The booking address cannot.</p>
      </div>

      <aside className="flex flex-col gap-4 lg:pt-[5.25rem]">
        <div className="rounded-card bg-sheet p-5">
          <p className="text-label font-medium text-text-2">What pet owners see</p>
          <div className="mt-3 rounded-guide bg-field p-4">
            <p className="truncate text-[17px] font-medium text-text">{previewName}</p>
            <p className="mt-0.5 truncate text-[13px] text-text-2">{previewCity}</p>
            <p className="mt-3 truncate text-[13px] tabular text-text-2">kalinga.cjjutba.dev/{previewSlug}</p>
            <div className="mt-3 flex items-center gap-2 rounded-tag bg-sheet px-3 py-2 text-[13px] text-text-2">
              <CalendarClock className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Times shown in {tz.split("/")[1].replace("_", " ")}
            </div>
          </div>
        </div>

        <div className="rounded-card bg-sheet p-5">
          <p className="text-label font-medium text-text-2">Then, inside</p>
          <ul className="mt-3 flex flex-col gap-3">
            <li className="flex gap-3 text-[15px]">
              <ListChecks className="mt-0.5 size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
              <span>
                Add your services
                <span className="block text-[13px] text-text-2">How long each takes, what it costs.</span>
              </span>
            </li>
            <li className="flex gap-3 text-[15px]">
              <Clock className="mt-0.5 size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
              <span>
                Set working hours
                <span className="block text-[13px] text-text-2">Per vet or groomer, plus closures.</span>
              </span>
            </li>
            <li className="flex gap-3 text-[15px]">
              <UserPlus className="mt-0.5 size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
              <span>
                Invite your staff
                <span className="block text-[13px] text-text-2">Front desk runs the day, vets see their column.</span>
              </span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
