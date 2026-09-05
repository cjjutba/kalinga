import type { Metadata } from "next";
import { Suspense } from "react";
import { HoursSettings } from "@/components/staff/settings";

export const metadata: Metadata = { title: "Working hours" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <HoursSettings orgSlug={org} />
    </Suspense>
  );
}
