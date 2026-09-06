"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { authClient } from "@/lib/auth-client";

// The owner's first step. An account, then a clinic on the next page.

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Your name, as your staff will see it.";
    if (!email.includes("@")) next.email = "A real email. Invitations and resets go here.";
    if (password.length < 10) next.password = "Use at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    if (error) {
      setLoading(false);
      setErrors({ email: error.message?.includes("exist") ? "That email already has an account. Sign in instead." : error.message ?? "Could not create the account." });
      return;
    }
    router.push("/new");
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <AuthTitle lead="One account runs one or several clinics.">Create your account</AuthTitle>
      <InputField on="auth" label="Your name" name="name" autoComplete="name" placeholder="Dr. Ana Reyes" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} disabled={loading} />
      <InputField on="auth" label="Email" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={loading} />
      <InputField on="auth" label="Choose a password" type="password" name="password" autoComplete="new-password" placeholder="At least 10 characters" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={loading} />
      <Pill type="submit" block loading={loading} loadingLabel="Creating your account">
        Continue
      </Pill>
      <p className="text-center">
        <Link href="/sign-in" className="text-small font-medium text-text hover:underline">
          Already have an account? Sign in
        </Link>
      </p>
      <PrivacyFooter />
    </form>
  );
}
