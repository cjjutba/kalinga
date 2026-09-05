import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalAppointment } from "@/components/portal/portal-pages";

export const metadata: Metadata = { title: "Appointment" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PortalAppointment id={id} />
    </Suspense>
  );
}
