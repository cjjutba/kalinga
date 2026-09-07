"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { placeholder } from "@/content/placeholders";
import { submitPilotRequest, type PilotRequestResult } from "@/lib/actions/pilot";

// Four fields, because a clinic owner filling this in is standing at a desk.
// Same shape as the deletion request form: a honeypot, rate limited per
// connection on the server, and honest about whether the mail actually went.

export function PilotForm() {
  const [form, setForm] = useState({ name: "", clinic: "", city: "", contact: "", website: "" });
  const [errors, setErrors] = useState<{ name?: string; clinic?: string; contact?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Extract<PilotRequestResult, { ok: true }> | null>(null);
  const [failed, setFailed] = useState<string | undefined>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Who should we ask for?";
    if (form.clinic.trim().length < 2) next.clinic = "The clinic's name.";
    if (form.contact.trim().length < 5) next.contact = "A mobile or an email we can answer on.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setFailed(undefined);
    setBusy(true);
    const r = await submitPilotRequest(form);
    setBusy(false);
    if (!r.ok) return setFailed(r.error);
    setDone(r);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 rounded-card bg-page p-6">
        <p className="flex items-center gap-2 text-body font-medium">
          <Check className="size-4" strokeWidth={2} aria-hidden /> We have it
        </p>
        <p className="text-small text-text-2">
          We will get back to you at <span className="text-text">{form.contact.trim()}</span>. Nothing is charged during the pilot, and you can set the clinic up yourself in the meantime.
        </p>
        {!done.delivered ? (
          <p className="text-label text-text-2">
            Our mail service is not connected here, so this was logged rather than sent. To be safe, email <span className="font-medium text-text">{done.inbox}</span> as well.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-card bg-page p-5 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={placeholder.personName} error={errors.name} disabled={busy} />
        <InputField label="Clinic" value={form.clinic} onChange={(e) => setForm((f) => ({ ...f, clinic: e.target.value }))} placeholder={placeholder.theirClinicName} error={errors.clinic} disabled={busy} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="City" hint="Optional" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder={placeholder.city} disabled={busy} />
        <InputField label="Mobile or email" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder={placeholder.mobileOrEmail} error={errors.contact} disabled={busy} />
      </div>
      {/* Left empty by a person, filled by a robot. */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
      {failed ? (
        <p role="alert" className="text-small text-error">
          {failed}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Pill type="submit" size="sm" loading={busy} loadingLabel="Sending">
          Ask about a pilot
        </Pill>
        <span className="text-label text-text-2">We answer within a day.</span>
      </div>
    </form>
  );
}
