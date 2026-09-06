import type { Metadata } from "next";
import { Suspense } from "react";
import { PetForm } from "@/components/staff/pets";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "New pet" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "edit_clients");
  return (
    <Suspense fallback={null}>
      <PetForm orgSlug={org} />
    </Suspense>
  );
}
