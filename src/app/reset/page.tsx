import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetFlow } from "./reset-flow";

export const metadata: Metadata = { title: "Reset your password" };

export default function ResetPage() {
  return (
    <AuthShell photoCaption="Photograph, a black aspin">
      <Suspense fallback={null}>
        <ResetFlow />
      </Suspense>
    </AuthShell>
  );
}
