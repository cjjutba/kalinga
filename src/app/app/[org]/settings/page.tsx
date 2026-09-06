import type { Metadata } from "next";
import { Suspense } from "react";
import { ClinicSettings } from "@/components/staff/settings";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_settings");
  return (
    <Suspense fallback={null}>
      <ClinicSettings />
    </Suspense>
  );
}
