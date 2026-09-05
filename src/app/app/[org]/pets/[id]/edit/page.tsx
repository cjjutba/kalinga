import type { Metadata } from "next";
import { Suspense } from "react";
import { PetForm } from "@/components/staff/pets";

export const metadata: Metadata = { title: "Edit pet" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  return (
    <Suspense fallback={null}>
      <PetForm orgSlug={org} id={id} />
    </Suspense>
  );
}
