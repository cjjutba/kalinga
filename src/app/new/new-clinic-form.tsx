"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { GuideCard } from "@/components/primitives/surfaces";
import { useUiState } from "@/lib/use-ui-state";
import { clinicNow, formatTime } from "@/lib/time";

// Three fields and the clinic can take a booking. The slug is the link the
// clinic shares, so the taken state matters more than usual.

const takenSlugs = new Set(["lunhaw", "amihan", "kalinga", "demo", "app"]);

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
  const forced = useUiState<"taken">();
  const [name, setName] = useState(forced ? "Lunhaw Animal Clinic" : "");
  const [slug, setSlug] = useState(forced ? "lunhaw" : "");
  const [slugTouched, setSlugTouched] = useState(!!forced);
  const [tz, setTz] = useState("Asia/Manila");
  const [error, setError] = useState<string | undefined>(forced === "taken" ? "lunhaw is taken. Try lunhaw-cdo." : undefined);
  const [nameError, setNameError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<string | null>(null);

  // The live clinic clock only renders on the client, so the server and the
  // first client render agree.
  useEffect(() => {
    const tick = () => setNow(formatTime(clinicNow(tz), tz));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tz]);

  function onName(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    let bad = false;
    if (!name.trim()) {
      setNameError("Give the clinic its name as pet owners know it.");
      bad = true;
    } else setNameError(undefined);
    if (!slug) {
      setError("Choose a booking address.");
      bad = true;
    } else if (takenSlugs.has(slug)) {
      setError(`${slug} is taken. Try ${slug}-cdo.`);
      bad = true;
    } else setError(undefined);
    if (bad) return;
    setLoading(true);
    window.setTimeout(() => router.push("/app/lunhaw?state=first-run"), 900);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <AuthTitle>Set up your clinic</AuthTitle>
      <GuideCard tone="auto" name="Dr. Ana Reyes" initials="AR">
        Three fields and you can take a booking. Everything else can wait.
      </GuideCard>
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
        helper="This is the link you share with pet owners."
        error={error}
        disabled={loading}
        autoCapitalize="off"
        spellCheck={false}
      />
      <SelectField on="auto" label="Time zone" value={tz} onChange={setTz} options={zones} helper={now ? `It is ${now} in ${tz.split("/")[1]} right now.` : "Appointments show in this zone, labelled."} disabled={loading} />
      <Pill type="submit" block loading={loading} loadingLabel="Creating clinic">
        Create clinic
      </Pill>
      <PrivacyFooter />
    </form>
  );
}
