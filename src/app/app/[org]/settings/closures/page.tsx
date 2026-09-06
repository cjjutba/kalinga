import type { Metadata } from "next";
import { Suspense } from "react";
import { ClosuresSettings } from "@/components/staff/settings";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Closures" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_settings");
  return (
    <Suspense fallback={null}>
      <ClosuresSettings />
    </Suspense>
  );
}
