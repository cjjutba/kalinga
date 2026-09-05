import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { NewClinicForm } from "./new-clinic-form";

export const metadata: Metadata = { title: "Set up your clinic" };

export default function NewClinicPage() {
  return (
    <AuthShell photoCaption="Photograph, a white cat">
      <Suspense fallback={null}>
        <NewClinicForm />
      </Suspense>
    </AuthShell>
  );
}
