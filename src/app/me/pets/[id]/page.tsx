import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalPet } from "@/components/portal/portal-pages";

export const metadata: Metadata = { title: "Pet" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PortalPet id={id} />
    </Suspense>
  );
}
