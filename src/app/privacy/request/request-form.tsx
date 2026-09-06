"use client";

import { placeholder } from "@/content/placeholders";
import { useState, type FormEvent } from "react";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { submitPrivacyRequest, type PrivacyRequestResult } from "@/lib/actions/privacy";

// The working route for deletion requests RA 10173 asks for. A form with a
// honeypot, rate limited per connection on the server.

export function DeletionRequestForm() {
  const [form, setForm] = useState({ contact: "", clinic: "", kind: "delete" as "delete" | "copy" | "correct", details: "", website: "" });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Extract<PrivacyRequestResult, { ok: true }> | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.contact.trim()) {
      setError("The mobile or email you booked with, so we can find your records.");
      return;
    }
    setError(undefined);
    setBusy(true);
    const r = await submitPrivacyRequest(form);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setDone(r);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-medium">We have your request</h1>
        <p className="text-body text-text-2">We will confirm what we found and what we did within fifteen days, to the contact you gave. If you booked with more than one clinic, tell us and we will cover each.</p>
        {!done.delivered ? (
          <p className="rounded-guide bg-sheet p-4 text-small text-text-2">
            Our mail service is not connected yet, so the request has been logged rather than emailed. To be safe, also send it to <span className="font-medium text-text">{done.inbox}</span>.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-medium">Ask for your data, or have it deleted</h1>
        <p className="mt-2 text-small text-text-2">Free, and answered within fifteen days. Say which clinic you booked with and how to reach you.</p>
      </div>
      <Card className="flex flex-col gap-5 p-6">
        <InputField label="Mobile or email you booked with" placeholder={placeholder.mobileOrEmail} value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} error={error} autoComplete="off" />
        <InputField label="Clinic" hint="If you know it" value={form.clinic} onChange={(e) => setForm((f) => ({ ...f, clinic: e.target.value }))} placeholder={placeholder.theirClinicName} />
        <SelectField label="What would you like" value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v as typeof form.kind }))} options={[{ value: "delete", label: "Delete everything about me and my pets" }, { value: "copy", label: "A copy of what you hold" }, { value: "correct", label: "Correct something" }]} />
        <TextareaField label="Anything else" placeholder={placeholder.reason} hint="Optional" rows={3} value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} />
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
          <label>
            Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </label>
        </div>
        <Pill type="submit" block loading={busy} loadingLabel="Sending">
          Send request
        </Pill>
      </Card>
    </form>
  );
}
