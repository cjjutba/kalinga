import type { Metadata } from "next";
import { Suspense } from "react";
import { ClinicPage } from "@/components/booking/clinic-page";

export async function generateMetadata({ params }: { params: Promise<{ clinic: string }> }): Promise<Metadata> {
  const { clinic } = await params;
  return { title: clinic === "lunhaw" ? "Lunhaw Animal Clinic" : clinic === "amihan" ? "Amihan Veterinary Clinic" : "Clinic" };
}

export default async function Page({ params }: { params: Promise<{ clinic: string }> }) {
  const { clinic } = await params;
  return (
    <Suspense fallback={null}>
      <ClinicPage slug={clinic} />
    </Suspense>
  );
}
