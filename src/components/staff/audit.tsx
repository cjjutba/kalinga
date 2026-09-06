"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PageHeader, EmptyState, NotForRole } from "./page-header";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { useOrg } from "@/lib/org-data";
import type { AuditEvent } from "@/lib/domain/types";
import { can, roleLabel } from "@/lib/roles";
import { formatShortDate, formatTime, formatLongDate, formatTimeWithZone } from "@/lib/time";
import { cn } from "@/lib/utils";

// Append only. Actor, action, entity, before and after, timestamp. The owner
// can answer who cancelled an appointment and when.

const entityLabel: Record<AuditEvent["entityType"], string> = {
  appointment: "Appointment",
  pet: "Pet",
  owner: "Client",
  visit: "Visit",
  member: "Member",
  service: "Service",
  provider: "Schedule",
  reminder: "Reminder",
  organisation: "Clinic",
};

export function AuditTrail({ orgSlug }: { orgSlug: string }) {
  const { org, audit, members, role } = useOrg(orgSlug);
  const [actor, setActor] = useState("all");
  const [entity, setEntity] = useState("all");
  const [q, setQ] = useState("");
  const tz = org.timezone;
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = audit.filter((e) => (actor === "all" || e.actorMemberId === actor) && (entity === "all" || e.entityType === entity) && (!s || e.action.toLowerCase().includes(s) || e.entityLabel.toLowerCase().includes(s))).slice(0, 200);
    return list.map((e, i) => {
      const day = formatShortDate(e.at, tz);
      return { e, day, showDay: i === 0 || formatShortDate(list[i - 1].at, tz) !== day };
    });
  }, [audit, actor, entity, q, tz]);
  if (!can(role, "view_audit")) return <NotForRole role={roleLabel[role]} page="The audit trail" />;

  return (
    <>
      <PageHeader title="Audit trail" lead={`${audit.length} events, newest first. Nothing here can be edited or deleted.`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <InputField on="page" label="Search" type="search" placeholder="Cancelled, Kiko, Grooming" value={q} onChange={(e) => setQ(e.target.value)} />
        <SelectField on="page" label="Who" value={actor} onChange={setActor} options={[{ value: "all", label: "Anyone" }, ...members.map((m) => ({ value: m.id, label: m.name }))]} />
        <SelectField on="page" label="What" value={entity} onChange={setEntity} options={[{ value: "all", label: "Everything" }, ...Object.entries(entityLabel).map(([v, l]) => ({ value: v, label: l }))]} />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No events match" lead="Loosen a filter." />
      ) : (
        <Card className="overflow-hidden">
          <ol>
            {rows.map(({ e, day, showDay }) => {
              return (
                <li key={e.id} className={cn(showDay && "border-t border-divider first:border-t-0")}>
                  {showDay ? <p className="bg-field/60 px-4 py-1.5 text-label font-medium text-text-2">{day}</p> : null}
                  <Link href={`/app/${org.slug}/audit/${e.id}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-divider px-4 py-3 text-small hover:bg-divider/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
                    <span className="w-16 tabular text-text-2">{formatTime(e.at, tz)}</span>
                    <span className="min-w-0">
                      <span className="block text-body">
                        <span className="font-medium">{e.actorName.replace(/^Dr\.\s*/, "Dr. ").split(" ").slice(0, 2).join(" ")}</span> {e.action.charAt(0).toLowerCase() + e.action.slice(1)}
                      </span>
                      <span className="block truncate text-text-2">
                        {entityLabel[e.entityType]}, {e.entityLabel}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </>
  );
}

function Value({ v }: { v: unknown }) {
  if (v === undefined || v === null || v === "") return <span className="text-text-2">empty</span>;
  if (Array.isArray(v)) return <>{v.join(", ")}</>;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return <span className="tabular">{formatShortDate(v)}, {formatTime(v)}</span>;
  return <>{String(v)}</>;
}

export function AuditEventDetail({ orgSlug, id }: { orgSlug: string; id: string }) {
  const { org, audit, role } = useOrg(orgSlug);
  const event = id === "first" ? audit[0] : audit.find((e) => e.id === id);
  if (!can(role, "view_audit")) return <NotForRole role={roleLabel[role]} page="The audit trail" />;
  if (!event) return <EmptyState title="That event is not in the trail" action={<Pill asChild size="sm" variant="secondary"><Link href={`/app/${org.slug}/audit`}>Back to the trail</Link></Pill>} />;
  const keys = Array.from(new Set([...Object.keys(event.before ?? {}), ...Object.keys(event.after ?? {})]));
  // The stored keys are code names. The owner reads words.
  const fieldLabel: Record<string, string> = {
    startsAt: "Starts at",
    status: "Status",
    reason: "Reason",
    role: "Role",
    emailed: "Client emailed",
    weightKg: "Weight, kg",
    administered: "Administered",
    name: "Name",
    mobile: "Mobile",
    email: "Email",
    to: "Sent to",
    days: "Working days",
    closures: "Closures",
    pets: "Pets removed",
    appointments: "Appointments removed",
    visits: "Visits removed",
    reminders: "Reminders removed",
    price: "Price",
    pricePhp: "Price",
    durationMin: "Minutes",
    bufferMin: "Buffer",
    publiclyBookable: "Bookable online",
    recallKind: "Recall",
    timezone: "Time zone",
    city: "City",
    address: "Address",
    openFrom: "Opens",
    openTo: "Closes",
    groomingIntervalWeeks: "Grooming interval, weeks",
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={event.action}
        lead={
          <>
            {event.actorName}, {formatLongDate(event.at, org.timezone)} at {formatTimeWithZone(event.at, org.timezone)}.{" "}
            <Link href={`/app/${org.slug}/audit`} className="font-medium text-text hover:underline">
              Back to the trail
            </Link>
          </>
        }
      />
      <Card className="p-6">
        <p className="text-small text-text-2">
          {entityLabel[event.entityType]}, {event.entityLabel}
        </p>
        {keys.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="text-left text-label text-text-2">
                  <th className="py-2 pr-4 font-medium">Field</th>
                  <th className="py-2 pr-4 font-medium">Before</th>
                  <th className="py-2 font-medium">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {keys.map((k) => {
                  const b = event.before?.[k];
                  const a = event.after?.[k];
                  const changed = JSON.stringify(b) !== JSON.stringify(a);
                  return (
                    <tr key={k}>
                      <td className="py-2.5 pr-4 text-text-2">{fieldLabel[k] ?? k}</td>
                      <td className={cn("py-2.5 pr-4", changed && b !== undefined && "line-through decoration-1 text-text-2")}>
                        <Value v={b} />
                      </td>
                      <td className={cn("py-2.5", changed && "font-medium")}>
                        <Value v={a} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-small text-text-2">This event carries no field changes. It records that the action happened.</p>
        )}
      </Card>
    </div>
  );
}
