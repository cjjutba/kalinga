"use client";

import { Fragment, useMemo, useState } from "react";
import { TZDate } from "@date-fns/tz";
import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";
import { PageHeader, EmptyState } from "./page-header";
import { FirstRun } from "./first-run";
import { AppointmentDrawer } from "./appointment-drawer";
import { CancelDialog, NewAppointmentDialog, RescheduleDialog, WalkInDialog } from "./dialogs";
import { ReminderPreview } from "@/components/sandbox/reminder-preview";
import { Pill } from "@/components/primitives/pill";
import { StatusPill } from "@/components/primitives/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/lib/mock/store";
import { appointmentsOn, daysWithAppointments, defaultDay, joinAppointment } from "@/lib/mock/selectors";
import type { AppointmentStatus } from "@/lib/mock/types";
import { can } from "@/lib/roles";
import { clinicNow, dayKey, formatTime, relativeDayLabel, zoneLabel } from "@/lib/time";
import { useMounted } from "@/lib/use-mounted";
import { useUiState } from "@/lib/use-ui-state";
import { cn } from "@/lib/utils";

// One screen that runs the day. Time ordered, status visible at a glance,
// confirm, cancel, reschedule and mark arrived without leaving it. Defaults
// to today if today has appointments, otherwise the next day that does, and
// says which day it is showing. Designed against the bad Tuesday.

const order: AppointmentStatus[] = ["arrived", "confirmed", "booked", "completed", "cancelled", "no_show"];

export function DayView({ orgSlug }: { orgSlug: string }) {
  const { org, appointments, pets, owners, services, providers, role, members, actorMemberId } = useOrg(orgSlug);
  const ui = useUiState<"empty" | "loading" | "first-run">();
  const tz = org.timezone;
  const mounted = useMounted();
  const [day, setDay] = useState<TZDate>(() => defaultDay(appointments, tz));
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);

  const actor = members.find((m) => m.id === actorMemberId);
  const activeFilter = filter ?? (role === "vet" && actor?.providerId ? actor.providerId : "all");
  const manage = can(role, "manage_appointments");

  const today = startOfDay(clinicNow(tz)) as TZDate;
  const rows = useMemo(() => {
    if (ui === "empty") return [];
    return appointmentsOn(appointments, day, tz)
      .filter((a) => activeFilter === "all" || a.providerId === activeFilter)
      .map((a) => joinAppointment({ pets, owners, services, providers }, a));
  }, [appointments, day, tz, activeFilter, pets, owners, services, providers, ui]);
  const busyDays = useMemo(() => daysWithAppointments(appointments, tz), [appointments, tz]);
  const counts = useMemo(() => {
    const c = new Map<AppointmentStatus, number>();
    for (const r of rows) c.set(r.appointment.status, (c.get(r.appointment.status) ?? 0) + 1);
    return order.filter((s) => c.get(s)).map((s) => ({ status: s, n: c.get(s)! }));
  }, [rows]);
  const strip = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(addDays(today, -1), i) as TZDate), [today]);
  const now = clinicNow(tz);
  const isToday = isSameDay(day, today);
  const nowIndex = isToday && mounted ? rows.findIndex((r) => !isBefore(new Date(r.appointment.startsAt), now)) : -1;

  if (ui === "first-run") return <FirstRun orgSlug={org.slug} clinicName={org.name} />;

  return (
    <>
      <PageHeader
        title={relativeDayLabel(day, tz)}
        lead={
          rows.length ? (
            <>
              {rows.length} {rows.length === 1 ? "appointment" : "appointments"}. Times in {zoneLabel(tz)}.
            </>
          ) : (
            <>Times in {zoneLabel(tz)}.</>
          )
        }
        actions={
          manage ? (
            <>
              <Pill size="sm" variant="secondary" onClick={() => setWalkInOpen(true)}>
                <UserPlus className="size-4" strokeWidth={1.5} aria-hidden /> Walk-in
              </Pill>
              <Pill size="sm" onClick={() => setNewOpen(true)}>
                <Plus className="size-4" strokeWidth={1.5} aria-hidden /> New appointment
              </Pill>
            </>
          ) : null
        }
      />

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDay((d) => addDays(d, -1) as TZDate)} aria-label="Previous day" className="grid size-10 shrink-0 place-items-center rounded-full bg-sheet hover:bg-divider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <div role="radiogroup" aria-label="Day" className="flex flex-1 gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none]">
            {strip.map((d) => {
              const sel = isSameDay(d, day);
              const has = busyDays.has(dayKey(d, tz));
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setDay(d)}
                  className={cn(
                    "flex min-w-[56px] flex-1 flex-col items-center rounded-input py-1.5 text-label transition-colors duration-150 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                    sel ? "bg-action text-on-action" : "bg-sheet text-text hover:bg-divider",
                  )}
                >
                  <span className="font-medium">{isSameDay(d, today) ? "Today" : format(d, "EEE")}</span>
                  <span className="text-body tabular">{format(d, "d")}</span>
                  <span className={cn("mt-0.5 size-1 rounded-full", has ? (sel ? "bg-on-action" : "bg-text") : "bg-transparent")} aria-hidden />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setDay((d) => addDays(d, 1) as TZDate)} aria-label="Next day" className="grid size-10 shrink-0 place-items-center rounded-full bg-sheet hover:bg-divider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Show" className="flex flex-wrap gap-1.5">
            {[{ id: "all", label: "Everyone" }, ...providers.map((p) => ({ id: p.id, label: p.name.replace(/^Dr\.\s*/, "Dr. ").split(" ").slice(0, 2).join(" ") }))].map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={activeFilter === opt.id}
                onClick={() => setFilter(opt.id)}
                className={cn(
                  "h-8 rounded-full px-3 text-label font-medium transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                  activeFilter === opt.id ? "bg-action text-on-action" : "bg-sheet text-text-2 hover:text-text",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {counts.length ? (
            <ul className="flex flex-wrap gap-2" aria-label="Summary">
              {counts.map(({ status, n }) => (
                <li key={status} className="flex items-center gap-1.5 text-label text-text-2">
                  <StatusPill status={status} size="sm" />
                  <span className="tabular">{n}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {ui === "loading" ? (
        <ul className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="rounded-guide bg-sheet p-4">
              <Skeleton className="h-4 w-24 rounded-tag bg-field" />
              <Skeleton className="mt-2 h-5 w-2/3 rounded-tag bg-field" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState
          title={`Nothing booked ${isToday ? "today" : "on " + format(day, "EEEE d MMMM")}`}
          lead={busyDays.size ? "The clinic is open. A quiet day, or the day view is on the wrong date." : "No appointments yet. Share the booking link and they will appear here."}
          action={
            manage ? (
              <Pill size="sm" onClick={() => setNewOpen(true)}>
                New appointment
              </Pill>
            ) : null
          }
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => {
            const a = r.appointment;
            const dim = a.status === "cancelled" || a.status === "no_show" || a.status === "completed";
            return (
              <Fragment key={a.id}>
                {i === nowIndex ? (
                  <li aria-label="Now" className="flex items-center gap-3 py-1 text-label text-text-2">
                    <span className="h-px flex-1 bg-text" />
                    <span className="tabular">Now, {formatTime(now, tz)}</span>
                    <span className="h-px flex-1 bg-text" />
                  </li>
                ) : null}
                <li>
                <button
                  type="button"
                  onClick={() => setSelected(a.id)}
                  className={cn(
                    "grid w-full grid-cols-[76px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 rounded-guide bg-sheet px-4 py-3 text-left",
                    "md:grid-cols-[80px_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center",
                    "hover:bg-divider/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page transition-colors duration-150 motion-reduce:transition-none",
                  )}
                >
                  <span className={cn("whitespace-nowrap text-small font-medium tabular md:text-body", dim && "text-text-2")}>{formatTime(a.startsAt, tz)}</span>
                  <span className="min-w-0">
                    <span className={cn("block text-body font-medium", dim && "text-text-2", a.status === "cancelled" && "line-through decoration-1")}>
                      {r.pet?.name ?? "Pet"}
                      <span className="font-normal text-text-2">, {r.pet?.breed}</span>
                    </span>
                    <span className="block text-small text-text-2">
                      {r.owner?.name}
                      {!r.owner?.mobile ? <span className="text-text-2">, no mobile on file</span> : null}
                    </span>
                  </span>
                  <span className="col-start-3 row-start-1 md:col-start-5">
                    <StatusPill status={a.status} size="sm" />
                  </span>
                  <span className="col-span-2 col-start-2 text-small text-text-2 md:col-span-1 md:col-start-3">
                    {r.service ? `${r.service.name}, ${r.service.durationMin} min` : <span className="italic">Walk-in, no service yet</span>}
                  </span>
                  <span className="col-span-2 col-start-2 text-small text-text-2 md:col-span-1 md:col-start-4">{r.provider?.name}</span>
                </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}

      <ReminderPreview orgSlug={org.slug} />

      <AppointmentDrawer orgSlug={org.slug} appointmentId={selected} onClose={() => setSelected(null)} onCancel={(id) => { setSelected(null); setCancelId(id); }} onReschedule={(id) => { setSelected(null); setRescheduleId(id); }} />
      <CancelDialog orgSlug={org.slug} appointment={appointments.find((a) => a.id === cancelId) ?? null} open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} />
      <RescheduleDialog orgSlug={org.slug} appointment={appointments.find((a) => a.id === rescheduleId) ?? null} open={!!rescheduleId} onOpenChange={(o) => !o && setRescheduleId(null)} />
      <NewAppointmentDialog orgSlug={org.slug} open={newOpen} onOpenChange={setNewOpen} day={day} />
      <WalkInDialog orgSlug={org.slug} open={walkInOpen} onOpenChange={setWalkInOpen} />
    </>
  );
}
