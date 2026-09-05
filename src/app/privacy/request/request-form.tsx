"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { InputField, SelectField, TextareaField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { useUiState } from "@/lib/use-ui-state";

// The working route for deletion requests RA 10173 asks for. A form with a
// honeypot, rate limited on the server in the real build. In the prototype it
// shows the received state and sends nothing.

export function DeletionRequestForm() {
  const router = useRouter();
  const ui = useUiState<"sent">();
  const [form, setForm] = useState({ contact: "", clinic: "", kind: "delete", details: "", website: "" });
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(ui === "sent");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (form.website) return;
    if (!form.contact.trim()) {
      setError("The mobile or email you booked with, so we can find your records.");
      return;
    }
    setError(undefined);
    setSent(true);
    router.replace("/privacy/request?state=sent");
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-medium">We have your request</h1>
        <p className="text-body text-text-2">We will confirm what we found and what we did within fifteen days, to the contact you gave. If you booked with more than one clinic, tell us and we will cover each.</p>
        <p className="rounded-guide bg-sheet p-4 text-small text-text-2">Sandbox. Nothing was sent and nothing is stored. In the real product this request reaches the clinic and Kalinga together.</p>
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
        <InputField label="Mobile or email you booked with" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} error={error} autoComplete="off" />
        <InputField label="Clinic" hint="If you know it" value={form.clinic} onChange={(e) => setForm((f) => ({ ...f, clinic: e.target.value }))} placeholder="Lunhaw Animal Clinic" />
        <SelectField
          label="What would you like"
          value={form.kind}
          onChange={(v) => setForm((f) => ({ ...f, kind: v }))}
          options={[
            { value: "delete", label: "Delete everything about me and my pets" },
            { value: "copy", label: "A copy of what you hold" },
            { value: "correct", label: "Correct something" },
          ]}
        />
        <TextareaField label="Anything else" hint="Optional" rows={3} value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} />
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
          <label>
            Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </label>
        </div>
        <Pill type="submit" block>
          Send request
        </Pill>
      </Card>
    </form>
  );
}
