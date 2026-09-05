"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { authClient } from "@/lib/auth-client";

// Request a link, then set a new password from the link. The token arrives
// in the URL from the email Better Auth sends through Resend. Without a
// mail key the server logs the link instead, and nothing pretends otherwise.

function mask(email: string): string {
  const [u, d] = email.split("@");
  return u && d ? `${u[0]}•••@${d}` : "your address";
}

export function ResetFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const invalid = params.get("error") === "INVALID_TOKEN";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function request(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter the email you use for Kalinga.");
      return;
    }
    setError(undefined);
    setLoading(true);
    await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset" });
    setLoading(false);
    setSent(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    if (!token) return setError("This link is missing its token. Request a new one.");
    setError(undefined);
    setLoading(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (err) return setError("This link has expired or was already used. Request a new one.");
    router.push("/sign-in");
  }

  if (invalid) {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead="Request a new one and use it within the hour.">This link has expired</AuthTitle>
        <Pill asChild block variant="secondary">
          <Link href="/reset">Request a new link</Link>
        </Pill>
        <PrivacyFooter />
      </div>
    );
  }

  if (token) {
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

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead={`If ${mask(email)} has an account, a link is on its way. It works for one hour.`}>Check your email</AuthTitle>
        <p className="text-center">
          <button type="button" onClick={() => setSent(false)} className="text-small font-medium text-text hover:underline">
            Send it again
          </button>
        </p>
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
