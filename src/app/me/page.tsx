import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalSignIn } from "@/components/portal/portal-pages";

export const metadata: Metadata = { title: "Your Kalinga" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PortalSignIn />
    </Suspense>
  );
}
