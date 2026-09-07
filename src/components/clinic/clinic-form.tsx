"use client";

import { placeholder } from "@/content/placeholders";
import { useEffect, useState, type FormEvent } from "react";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { authClient } from "@/lib/auth-client";
import { applyAction } from "@/lib/actions/apply";
import { clinicNow, formatTime } from "@/lib/time";
import { reservedSlugs, slugify } from "@/lib/slug";

// A second clinic, made from inside the first. The first one is set up at
// /new through the stepped onboarding; by the time somebody opens another they
// already have one on screen and do not need taking out of it, so this is four
// fields in a dialog and nothing else.
//
// The slug is the link the clinic shares, so the taken state matters more than
// usual and is checked as you type.

const zones = [
  { value: "Asia/Manila", label: "Asia/Manila" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
];

export function ClinicForm({ onDone, onBusyChange }: { onDone?: (slug: string | null) => void; /** Lets the dialog around this form keep itself open while it saves. */ onBusyChange?: (busy: boolean) => void } = {}) {
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
    if (!slug || reservedSlugs.has(slug)) return;
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
    } else if (reservedSlugs.has(slug)) {
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
    onDone?.(data.slug);
  }

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
