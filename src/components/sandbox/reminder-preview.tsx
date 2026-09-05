"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { useOrg } from "@/lib/mock/store";
import { can } from "@/lib/roles";
import { dueLabel } from "@/lib/time";

// The static reminder preview F4 ships before the real queue exists, so the
// first clinic conversation still includes recall. In the prototype the queue
// is built, so this panel points at it with one live example rather than a
// mockup. Shown at the foot of the day view for roles that can see recall.

export function ReminderPreview({ orgSlug }: { orgSlug: string }) {
  const { org, reminders, pets, owners, role } = useOrg(orgSlug);
  if (!can(role, "view_recall")) return null;
  const next = reminders.filter((r) => !r.sentAt).sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0];
  if (!next) return null;
  const pet = pets.find((p) => p.id === next.petId);
  const owner = owners.find((o) => o.id === pet?.ownerId);
  const due = reminders.filter((r) => !r.sentAt).length;
  return (
    <Card tone="tint" className="mt-8 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4" strokeWidth={1.5} aria-hidden />
          <p className="text-label font-medium text-text-2">Recall, the part clinics pay for</p>
        </div>
        <StatusPill status={next.dueOn < new Date().toISOString().slice(0, 10) ? "overdue" : "due"} size="sm" />
      </div>
      <p className="mt-2 text-body">
        {due} {due === 1 ? "reminder is" : "reminders are"} ready to send. Next: {pet?.name}, {owner?.name.split(" ")[0]}, {dueLabel(next.dueOn, org.timezone)}.
      </p>
      <blockquote className="mt-3 rounded-guide bg-sheet/70 p-3.5 text-small leading-[1.5]">{next.message}</blockquote>
      <Link href={`/app/${org.slug}/recall`} className="mt-3 inline-block text-small font-medium text-text hover:underline">
        Open the recall queue
      </Link>
    </Card>
  );
}
