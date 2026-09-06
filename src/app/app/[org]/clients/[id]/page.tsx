import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientDetail } from "@/components/staff/clients";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Client" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  await requirePagePermission(org, "view_clients");
  return (
    <Suspense fallback={null}>
      <ClientDetail orgSlug={org} id={id} />
    </Suspense>
  );
}
