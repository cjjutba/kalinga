import type { Metadata } from "next";
import { Suspense } from "react";
import { ReminderLog } from "@/components/staff/recall";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Reminder log" };

export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  await requirePagePermission(org, "view_recall");
  return (
    <Suspense fallback={null}>
      <ReminderLog orgSlug={org} />
    </Suspense>
  );
}
