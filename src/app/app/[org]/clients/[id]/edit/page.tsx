import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientForm } from "@/components/staff/clients";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Edit client" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  await requirePagePermission(org, "edit_clients");
  return (
    <Suspense fallback={null}>
      <ClientForm orgSlug={org} id={id} />
    </Suspense>
  );
}
