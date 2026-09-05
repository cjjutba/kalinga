import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalAppointments } from "@/components/portal/portal-pages";

export const metadata: Metadata = { title: "Appointments" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PortalAppointments />
    </Suspense>
  );
}
