import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChooseClinic } from "./choose-clinic";

export const metadata: Metadata = { title: "Choose a clinic" };

export default function ChooseClinicPage() {
  return (
    <AuthShell showCard={false}>
      <Suspense fallback={null}>
        <ChooseClinic />
      </Suspense>
    </AuthShell>
  );
}
