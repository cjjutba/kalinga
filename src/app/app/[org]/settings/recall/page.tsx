import type { Metadata } from "next";
import { Suspense } from "react";
import { RecallSettings } from "@/components/staff/settings";

export const metadata: Metadata = { title: "Recall rules" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  await params;
  return (
    <Suspense fallback={null}>
      <RecallSettings />
    </Suspense>
  );
}
