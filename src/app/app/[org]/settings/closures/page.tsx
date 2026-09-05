import type { Metadata } from "next";
import { Suspense } from "react";
import { ClosuresSettings } from "@/components/staff/settings";

export const metadata: Metadata = { title: "Closures" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  await params;
  return (
    <Suspense fallback={null}>
      <ClosuresSettings />
    </Suspense>
  );
}
