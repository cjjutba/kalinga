"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to sign in.");
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: err } = await authClient.signIn.email({ email, password });
    if (err) {
      setLoading(false);
      setError(err.status === 429 ? "Too many attempts. Wait a minute and try again." : "That email and password do not match. Try again or reset it.");
      return;
    }
    router.push(next && next.startsWith("/") ? next : "/app");
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <AuthTitle>Sign in</AuthTitle>
      <InputField on="auto" label="Email" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
      <InputField on="auto" label="Password" type="password" name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} disabled={loading} />
      <Pill type="submit" block loading={loading} loadingLabel="Signing in">
        Sign in
      </Pill>
      <p className="text-center">
        <Link href="/reset" className="text-small font-medium text-text hover:underline">
          Forgot password?
        </Link>
      </p>
      <Pill asChild block variant="secondary" className="mt-2">
        <Link href="/sign-up">New clinic? Create your account</Link>
      </Pill>
      <PrivacyFooter />
    </form>
  );
}
