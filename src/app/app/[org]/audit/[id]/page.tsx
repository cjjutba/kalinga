import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditEventDetail } from "@/components/staff/audit";

export const metadata: Metadata = { title: "Audit event" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  return (
    <Suspense fallback={null}>
      <AuditEventDetail orgSlug={org} id={id} />
    </Suspense>
  );
}
