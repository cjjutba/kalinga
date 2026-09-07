"use client";

import { placeholder } from "@/content/placeholders";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { GoogleButton, OrDivider } from "@/components/auth/google";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ google = false }: { google?: boolean }) {
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
      {google ? (
        <>
          <GoogleButton next={next ?? undefined} disabled={loading} />
          <OrDivider />
        </>
      ) : null}
      <InputField on="auth" label="Email" type="email" name="email" autoComplete="email" inputMode="email" placeholder={placeholder.email} value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
      <InputField
        on="auth"
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder={placeholder.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
        disabled={loading}
        labelAction={
          <Link href="/reset" className="text-[13px] font-medium text-text-2 hover:text-text hover:underline">
            Forgot password?
          </Link>
        }
      />
      <Pill type="submit" block loading={loading} loadingLabel="Signing in">
        Sign in
      </Pill>
      <Pill asChild block variant="text">
        <Link href="/sign-up">Create an account</Link>
      </Pill>
      <PrivacyFooter />
    </form>
  );
}
