import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffSettings } from "@/components/staff/settings";

export const metadata: Metadata = { title: "Staff" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <Suspense fallback={null}>
      <StaffSettings orgSlug={org} />
    </Suspense>
  );
}
