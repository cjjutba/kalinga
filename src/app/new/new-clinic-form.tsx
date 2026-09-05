"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { GuideCard } from "@/components/primitives/surfaces";
import { authClient } from "@/lib/auth-client";
import { applyAction } from "@/lib/actions/apply";
import { clinicNow, formatTime } from "@/lib/time";

// Three fields and the clinic exists. The slug is the link the clinic shares,
// so the taken state matters more than usual and is checked as you type.

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

export function NewClinicForm() {
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
    setFormError(undefined);
    const { data, error } = await authClient.organization.create({ name: name.trim(), slug });
    if (error || !data) {
      setLoading(false);
      setFormError(error?.message ?? "Could not create the clinic.");
      return;
    }
    await authClient.organization.setActive({ organizationId: data.id });
    await applyAction(data.slug, { type: "org/update", changes: { timezone: tz, city: city.trim() || undefined } });
    router.push(`/app/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <AuthTitle>Set up your clinic</AuthTitle>
      <GuideCard tone="auto" name="Kalinga" initials="K">
        Three fields and you can take a booking. Services, hours and staff come next, inside.
      </GuideCard>
      {formError ? (
        <p role="alert" className="text-small text-error">
          {formError}
        </p>
      ) : null}
      <InputField on="auto" label="Clinic name" name="clinic" placeholder="Lunhaw Animal Clinic" value={name} onChange={(e) => onName(e.target.value)} error={nameError} disabled={loading} />
      <InputField
        on="auto"
        label="Booking address"
        name="slug"
        prefix="kalinga.cjjutba.dev/"
        placeholder="lunhaw"
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
      <InputField on="auto" label="City" hint="Optional" name="city" placeholder="Cagayan de Oro" value={city} onChange={(e) => setCity(e.target.value)} disabled={loading} />
      <SelectField on="auto" label="Time zone" value={tz} onChange={setTz} options={zones} helper={now ? `It is ${now} in ${tz.split("/")[1]} right now.` : "Appointments show in this zone, labelled."} disabled={loading} />
      <Pill type="submit" block loading={loading} loadingLabel="Creating clinic">
        Create clinic
      </Pill>
      <PrivacyFooter />
    </form>
  );
}
