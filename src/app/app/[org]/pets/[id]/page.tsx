import type { Metadata } from "next";
import { Suspense } from "react";
import { PetRecord } from "@/components/staff/pets";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Pet record" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  await requirePagePermission(org, "view_clients");
  return (
    <Suspense fallback={null}>
      <PetRecord orgSlug={org} id={id} />
    </Suspense>
  );
}
