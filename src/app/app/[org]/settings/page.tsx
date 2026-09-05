import type { Metadata } from "next";
import { Suspense } from "react";
import { ClinicSettings } from "@/components/staff/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <ClinicSettings orgSlug={org} />
    </Suspense>
  );
}
