import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientExport } from "@/components/staff/client-export";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Data export" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  await requirePagePermission(org, "privacy_requests");
  return (
    <Suspense fallback={null}>
      <ClientExport orgSlug={org} id={id} />
    </Suspense>
  );
}
