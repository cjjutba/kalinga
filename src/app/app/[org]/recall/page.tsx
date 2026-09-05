import type { Metadata } from "next";
import { Suspense } from "react";
import { RecallQueue } from "@/components/staff/recall";

export const metadata: Metadata = { title: "Recall" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <RecallQueue orgSlug={org} />
    </Suspense>
  );
}
