"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { useUiState } from "@/lib/use-ui-state";

// Prototype: any email and password signs in and lands on the demo clinic.
// ?state=error and ?state=loading force those states for review.

export function SignInForm() {
  const router = useRouter();
  const forced = useUiState<"error" | "loading">();
  const [email, setEmail] = useState(forced ? "maria@lunhaw.example" : "");
  const [password, setPassword] = useState(forced ? "password" : "");
  const [error, setError] = useState<string | undefined>(forced === "error" ? "That password is not right. Try again or reset it." : undefined);
  const [loading, setLoading] = useState(forced === "loading");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to sign in.");
      return;
    }
    setError(undefined);
    setLoading(true);
    window.setTimeout(() => router.push("/app/lunhaw"), 900);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <AuthTitle>Sign in</AuthTitle>
      <InputField
        on="auto"
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@clinic.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <InputField
        on="auto"
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
        disabled={loading}
      />
      <Pill type="submit" block loading={loading} loadingLabel="Signing in">
        Sign in
      </Pill>
      <p className="text-center">
        <Link href="/reset" className="text-small font-medium text-text hover:underline">
          Forgot password?
        </Link>
      </p>
      <Pill asChild block variant="secondary" className="mt-2">
        <Link href="/demo">Try the demo clinic, no account needed</Link>
      </Pill>
      <PrivacyFooter />
    </form>
  );
}
