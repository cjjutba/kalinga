import type { Metadata } from "next";
import { Suspense } from "react";
import { VisitDetail } from "@/components/staff/pets";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Visit" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string; visitId: string }> }) {
  const { org, id, visitId } = await params;
  await requirePagePermission(org, "view_visit_notes");
  return (
    <Suspense fallback={null}>
      <VisitDetail orgSlug={org} petId={id} visitId={visitId} />
    </Suspense>
  );
}
