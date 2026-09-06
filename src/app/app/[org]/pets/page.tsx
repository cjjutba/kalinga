import type { Metadata } from "next";
import { Suspense } from "react";
import { PetsList } from "@/components/staff/pets";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Pets" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_clients");
  return (
    <Suspense fallback={null}>
      <PetsList orgSlug={org} />
    </Suspense>
  );
}
