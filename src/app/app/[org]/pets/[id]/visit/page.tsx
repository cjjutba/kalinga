import type { Metadata } from "next";
import { Suspense } from "react";
import { VisitForm } from "@/components/staff/visit-form";

export const metadata: Metadata = { title: "Add visit" };

export default async function Page({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  return (
    <Suspense fallback={null}>
      <VisitForm orgSlug={org} petId={id} />
    </Suspense>
  );
}
