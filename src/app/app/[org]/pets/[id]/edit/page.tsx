import type { Metadata } from "next";
import { Suspense } from "react";
import { PetForm } from "@/components/staff/pets";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit pet" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  await requirePagePermission(org, "edit_clients");
  return (
    <Suspense fallback={null}>
      <PetForm orgSlug={org} id={id} />
    </Suspense>
  );
}
