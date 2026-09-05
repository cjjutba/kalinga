import type { Metadata } from "next";
import { Suspense } from "react";
import { PetRecord } from "@/components/staff/pets";

export const metadata: Metadata = { title: "Pet record" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  return (
    <Suspense fallback={null}>
      <PetRecord orgSlug={org} id={id} />
    </Suspense>
  );
}
