import type { Metadata } from "next";
import { Suspense } from "react";
import { DayView } from "@/components/staff/day-view";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Today" };

export default async function DayPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "day_view");
  return (
    <Suspense fallback={null}>
      <DayView orgSlug={org} />
    </Suspense>
  );
}
