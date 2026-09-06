"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, Mail, Undo2 } from "lucide-react";
import { PageHeader, EmptyState, NotForRole } from "./page-header";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/lib/org-data";
import { recallLabel } from "@/lib/domain/recall";
import type { RecallKind, Reminder } from "@/lib/domain/types";
import { can, roleLabel } from "@/lib/roles";
import { dueLabel, formatDate, formatShortDate, formatTime, isOverdue } from "@/lib/time";
import { useUiState } from "@/lib/use-ui-state";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/domain/selectors";

// The revenue feature. One screen on a Monday shows every animal due that
// week with the message already written. Nothing is sent from here. Staff
// copy the text and send it however they already talk to that client, then
// mark it sent so the log knows.

type Range = "week" | "overdue" | "next" | "all";
const kinds: RecallKind[] = ["vaccination", "deworming", "grooming"];

function inRange(r: Reminder, range: Range, tz: string): boolean {
  const days = Math.round((new Date(r.dueOn).getTime() - Date.now()) / 86_400_000);
  switch (range) {
    case "overdue":
      return isOverdue(r.dueOn, tz);
    case "week":
      return days >= -7 && days <= 7;
    case "next":
      return days > 7 && days <= 14;
    default:
      return true;
  }
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Pill
      size="xs"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? <Check className="size-3.5" strokeWidth={2} aria-hidden /> : <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />}
      {done ? "Copied" : "Copy message"}
    </Pill>
  );
}

export function RecallQueue({ orgSlug }: { orgSlug: string }) {
  const { org, reminders, pets, owners, members, role, dispatch, emailConfigured } = useOrg(orgSlug);
  const ui = useUiState<"empty" | "loading">();
  const [range, setRange] = useState<Range>("week");
  const [showSent, setShowSent] = useState(false);
  const tz = org.timezone;
  const rows = useMemo(() => {
    if (ui === "empty") return [];
    return reminders
      .filter((r) => inRange(r, range, tz) && (showSent || !r.sentAt))
      .map((r) => ({ r, pet: pets.find((p) => p.id === r.petId), owner: owners.find((o) => o.id === pets.find((p) => p.id === r.petId)?.ownerId) }))
      .sort((a, b) => a.r.dueOn.localeCompare(b.r.dueOn));
  }, [reminders, pets, owners, range, showSent, tz, ui]);
  if (!can(role, "view_recall")) return <NotForRole role={roleLabel[role]} page="Recall" />;
  const total = reminders.filter((r) => !r.sentAt && inRange(r, "week", tz)).length;

  return (
    <>
      <PageHeader
        title="Recall"
        lead={`${total} due this week and not yet sent. Copy the message, send it the way you already talk to that client, then mark it sent.`}
        actions={
          <Pill asChild size="sm" variant="secondary">
            <Link href={`/app/${org.slug}/recall/log`}>Reminder log</Link>
          </Pill>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Range" className="flex flex-wrap gap-1.5">
          {(
            [
              ["week", "This week"],
              ["overdue", "Overdue"],
              ["next", "Next week"],
              ["all", "Everything"],
            ] as [Range, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={range === v}
              onClick={() => setRange(v)}
              className={cn(
                "h-8 rounded-full px-3 text-label font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                range === v ? "bg-action text-on-action" : "bg-sheet text-text-2 hover:text-text",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-small text-text-2">
          <input type="checkbox" checked={showSent} onChange={(e) => setShowSent(e.target.checked)} className="size-4 accent-[var(--action)]" />
          Show sent
        </label>
      </div>

      {ui === "loading" ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card bg-sheet" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing due" lead={range === "week" ? "Every animal due this week has been reached, or nothing is due. Either way, a good Monday." : "Nothing in this range."} />
      ) : (
        <div className="flex flex-col gap-8">
          {kinds.map((kind) => {
            const group = rows.filter(({ r }) => r.kind === kind);
            if (!group.length) return null;
            return (
              <section key={kind} aria-labelledby={`recall-${kind}`}>
                <h2 id={`recall-${kind}`} className="mb-3 text-heading font-medium">
                  {recallLabel[kind]} <span className="text-text-2">{group.length}</span>
                </h2>
                <ul className="grid gap-3 lg:grid-cols-2">
                  {group.map(({ r, pet, owner }) => {
                    const overdue = isOverdue(r.dueOn, tz);
                    const sentBy = r.sentByMemberId ? members.find((m) => m.id === r.sentByMemberId)?.name : undefined;
                    return (
                      <li key={r.id}>
                        <Card className={cn("flex flex-col gap-3 p-5", r.sentAt && "opacity-70")}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-body font-medium">
                                <Link href={`/app/${org.slug}/pets/${pet?.id}`} className="hover:underline">
                                  {pet?.name}
                                </Link>
                                <span className="font-normal text-text-2">, {pet?.breed}</span>
                              </p>
                              <p className="text-small text-text-2">
                                {owner?.name}
                                {owner?.mobile ? <span className="tabular">, {owner.mobile}</span> : <span className="text-text-2">, no mobile, use Messenger or call</span>}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <StatusPill status={overdue ? "overdue" : "due"} size="sm" />
                              <span className="text-label text-text-2">{dueLabel(r.dueOn, tz)}</span>
                            </div>
                          </div>
                          <blockquote className="rounded-guide bg-field p-3.5 text-small leading-[1.5]">{r.message}</blockquote>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <CopyButton text={r.message} />
                              {!r.sentAt && owner?.email ? (
                                emailConfigured ? (
                                  <Pill size="xs" variant="secondary" onClick={() => dispatch({ type: "reminder/email", id: r.id })}>
                                    <Mail className="size-3.5" strokeWidth={1.5} aria-hidden /> Email {owner.email}
                                  </Pill>
                                ) : (
                                  <span className="text-label text-text-2">Email not connected, copy instead</span>
                                )
                              ) : null}
                            </div>
                            {r.sentAt ? (
                              <span className="flex items-center gap-2 text-label text-text-2">
                                {r.sentVia === "email" ? "Emailed" : "Sent"} {formatShortDate(r.sentAt, tz)}
                                {sentBy ? ` by ${firstName(sentBy)}` : ""}
                                <button type="button" onClick={() => dispatch({ type: "reminder/unsend", id: r.id })} className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-text hover:bg-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                                  <Undo2 className="size-3.5" strokeWidth={1.5} aria-hidden /> Undo
                                </button>
                              </span>
                            ) : (
                              <Pill size="xs" onClick={() => dispatch({ type: "reminder/sent", id: r.id })}>
                                Mark sent
                              </Pill>
                            )}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

export function ReminderLog({ orgSlug }: { orgSlug: string }) {
  const { org, reminders, pets, members, role } = useOrg(orgSlug);
  const ui = useUiState<"empty" | "loading">();
  const [filter, setFilter] = useState<"all" | "sent" | "unsent">("all");
  const tz = org.timezone;
  if (!can(role, "view_recall")) return <NotForRole role={roleLabel[role]} page="Reminder log" />;
  const rows = (ui === "empty" ? [] : reminders)
    .filter((r) => filter === "all" || (filter === "sent" ? !!r.sentAt : !r.sentAt))
    .sort((a, b) => (b.sentAt ?? b.generatedAt).localeCompare(a.sentAt ?? a.generatedAt));
  return (
    <>
      <PageHeader
        title="Reminder log"
        lead="Every reminder generated, when, how it went out, and who sent it. Kalinga emails only when Resend is connected. Everything else was copied by the desk and sent by hand."
        actions={
          <Pill asChild size="sm" variant="secondary">
            <Link href={`/app/${org.slug}/recall`}>Back to the queue</Link>
          </Pill>
        }
      />
      <div role="radiogroup" aria-label="Filter" className="mb-4 flex gap-1.5">
        {(["all", "sent", "unsent"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={filter === v}
            onClick={() => setFilter(v)}
            className={cn(
              "h-8 rounded-full px-3 text-label font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
              filter === v ? "bg-action text-on-action" : "bg-sheet text-text-2 hover:text-text",
            )}
          >
            {v === "all" ? "Everything" : v === "sent" ? "Marked sent" : "Not yet sent"}
          </button>
        ))}
      </div>
      {ui === "loading" ? (
        <Skeleton className="h-64 rounded-card bg-sheet" />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing logged" lead="Reminders appear here the moment the rules generate them." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-divider text-left text-label text-text-2">
                  <th className="px-4 py-3 font-medium">Generated</th>
                  <th className="px-4 py-3 font-medium">Pet</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">How</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {rows.map((r) => {
                  const pet = pets.find((p) => p.id === r.petId);
                  const by = r.sentByMemberId ? members.find((m) => m.id === r.sentByMemberId)?.name : undefined;
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-4 py-3 tabular text-text-2">
                        {formatShortDate(r.generatedAt, tz)}, {formatTime(r.generatedAt, tz)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{pet?.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">{recallLabel[r.kind]}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular">{formatDate(r.dueOn, tz)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{r.sentAt ? `${formatShortDate(r.sentAt, tz)}${by ? ", " + firstName(by) : ""}` : <span className="text-text-2">Not yet</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-2">{r.sentAt ? (r.sentVia === "email" ? "Email from Kalinga" : "Copied by the desk") : ""}</td>
                      <td className="max-w-md truncate px-4 py-3 text-text-2">{r.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
