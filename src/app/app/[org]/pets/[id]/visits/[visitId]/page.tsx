import type { Metadata } from "next";
import { Suspense } from "react";
import { VisitDetail } from "@/components/staff/pets";

export const metadata: Metadata = { title: "Visit" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string; visitId: string }> }) {
  const { org, id, visitId } = await params;
  return (
    <Suspense fallback={null}>
      <VisitDetail orgSlug={org} petId={id} visitId={visitId} />
    </Suspense>
  );
}
