import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalPets } from "@/components/portal/portal-pages";

export const metadata: Metadata = { title: "My pets" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PortalPets />
    </Suspense>
  );
}
