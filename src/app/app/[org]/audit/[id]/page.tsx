import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditEventDetail } from "@/components/staff/audit";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Audit event" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  await requirePagePermission(org, "view_audit");
  return (
    <Suspense fallback={null}>
      <AuditEventDetail orgSlug={org} id={id} />
    </Suspense>
  );
}
