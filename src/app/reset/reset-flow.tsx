"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Row } from "@/components/primitives/surfaces";
import { useUiState } from "@/lib/use-ui-state";

// Five screens in one flow: request, sent, the sandbox variant that shows the
// link on screen because nothing is emailed, choose a new password, expired.

type Step = "request" | "sent" | "sandbox" | "new" | "expired";

function mask(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "your address";
  return `${user[0]}•••@${domain}`;
}

export function ResetFlow() {
  const router = useRouter();
  const forced = useUiState<Step>();
  const [step, setStep] = useState<Step>(forced ?? "request");
  const [email, setEmail] = useState(forced ? "maria@lunhaw.example" : "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  function go(next: Step) {
    setStep(next);
    router.replace(next === "request" ? "/reset" : `/reset?state=${next}`);
  }

  function request(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter the email you use for Kalinga.");
      return;
    }
    setError(undefined);
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      go("sandbox");
    }, 700);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10) {
      setError("Use at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setError(undefined);
    setLoading(true);
    window.setTimeout(() => router.push("/sign-in"), 800);
  }

  if (step === "sent" || step === "sandbox") {
    return (
      <div className="flex flex-col gap-5">
        {step === "sandbox" ? (
          <div className="rounded-guide bg-field p-4 lg:bg-sheet">
            <p className="text-small font-medium text-text">Sandbox. Nothing is sent.</p>
            <p className="mt-1 text-small text-text-2">In the demo the reset link appears here instead of in an inbox.</p>
            <Row
              tone="auto"
              className="mt-3 bg-sheet px-3 py-2.5 lg:bg-field"
              title={<span className="text-small font-medium">Open reset link</span>}
              trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />}
              onClick={() => go("new")}
            />
          </div>
        ) : null}
        <AuthTitle lead={`We sent a link to ${mask(email)}. It works for one hour.`}>Check your email</AuthTitle>
        <p className="text-center">
          <button type="button" onClick={() => go("request")} className="text-small font-medium text-text hover:underline">
            Send it again
          </button>
        </p>
        <PrivacyFooter />
      </div>
    );
  }

  if (step === "new") {
    return (
      <form onSubmit={save} noValidate className="flex flex-col gap-5">
        <AuthTitle>Choose a new password</AuthTitle>
        <InputField on="auto" label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} helper="At least 10 characters." error={error} disabled={loading} />
        <InputField on="auto" label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
        <Pill type="submit" block loading={loading} loadingLabel="Saving">
          Save password
        </Pill>
        <PrivacyFooter />
      </form>
    );
  }

  if (step === "expired") {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead="Request a new one and use it within the hour.">This link has expired</AuthTitle>
        <Pill block variant="secondary" onClick={() => go("request")}>
          Request a new link
        </Pill>
        <PrivacyFooter />
      </div>
    );
  }

  return (
    <form onSubmit={request} noValidate className="flex flex-col gap-5">
      <AuthTitle lead="We'll email you a link that works for one hour.">Reset your password</AuthTitle>
      <InputField on="auto" label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} error={error} disabled={loading} />
      <Pill type="submit" block loading={loading} loadingLabel="Sending">
        Send reset link
      </Pill>
      <p className="text-center">
        <Link href="/sign-in" className="text-small font-medium text-text hover:underline">
          Back to sign in
        </Link>
      </p>
      <PrivacyFooter />
    </form>
  );
}
