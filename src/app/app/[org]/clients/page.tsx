import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientsList } from "@/components/staff/clients";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Clients" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_clients");
  return (
    <Suspense fallback={null}>
      <ClientsList orgSlug={org} />
    </Suspense>
  );
}
