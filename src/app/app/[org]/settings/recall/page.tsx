import type { Metadata } from "next";
import { Suspense } from "react";
import { RecallSettings } from "@/components/staff/settings";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Recall rules" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_settings");
  return (
    <Suspense fallback={null}>
      <RecallSettings />
    </Suspense>
  );
}
