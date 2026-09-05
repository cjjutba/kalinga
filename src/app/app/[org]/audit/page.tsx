import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditTrail } from "@/components/staff/audit";

export const metadata: Metadata = { title: "Audit trail" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <AuditTrail orgSlug={org} />
    </Suspense>
  );
}
