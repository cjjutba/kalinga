import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditTrail } from "@/components/staff/audit";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Audit trail" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_audit");
  return (
    <Suspense fallback={null}>
      <AuditTrail orgSlug={org} />
    </Suspense>
  );
}
