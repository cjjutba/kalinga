import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { googleIsConfigured } from "@/lib/auth";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <AuthShell photo="puspin">
      <Suspense fallback={null}>
        <SignUpForm google={googleIsConfigured} />
      </Suspense>
    </AuthShell>
  );
}
