"use client";

import { Fragment, useMemo, useState } from "react";
import { TZDate } from "@date-fns/tz";
import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";
import { PageHeader, EmptyState } from "./page-header";
import { FirstRun } from "./first-run";
import { AppointmentDrawer } from "./appointment-drawer";
import { CancelDialog, NewAppointmentDialog, RescheduleDialog, WalkInDialog } from "./dialogs";
import { Pill } from "@/components/primitives/pill";
import { StatusPill, statusLabel } from "@/components/primitives/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/lib/org-data";
import { appointmentsOn, daysWithAppointments, defaultDay, joinAppointment } from "@/lib/domain/selectors";
import type { AppointmentStatus } from "@/lib/domain/types";
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
  // A vet lands on their own next day with work, not on the clinic's.
  const ownProviderId = role === "vet" ? members.find((m) => m.id === actorMemberId)?.providerId : undefined;
  const [day, setDay] = useState<TZDate>(() => defaultDay(ownProviderId ? appointments.filter((a) => a.providerId === ownProviderId) : appointments, tz));
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);

  // After a booking, a move or a walk-in, show the day it landed on so the desk sees it.
  const showDayOf = (startsAt: string) => setDay(startOfDay(new TZDate(new Date(startsAt), tz)) as TZDate);
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
  // The line only means something once some of the day is behind you. At the
  // top of the list it says nothing the day has not already said.
  const nextUp = isToday && mounted ? rows.findIndex((r) => !isBefore(new Date(r.appointment.startsAt), now)) : -1;
  const nowIndex = nextUp > 0 ? nextUp : -1;
  // What the desk is counting is who is still coming.
  const live = rows.filter((r) => r.appointment.status !== "cancelled" && r.appointment.status !== "no_show").length;

  if (ui === "first-run" || (services.length === 0 && providers.length === 0)) return <FirstRun orgSlug={org.slug} clinicName={org.name} />;

  return (
    <>
      <PageHeader
        title={relativeDayLabel(day, tz)}
        lead={
          live ? (
            <>
              {live} {live === 1 ? "appointment" : "appointments"}. Times in {zoneLabel(tz)}.
            </>
          ) : rows.length ? (
            <>Nothing left on this day. Times in {zoneLabel(tz)}.</>
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

      {/* One toolbar: which day, then whose day. Nothing here repeats what
          the list underneath already says. */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDay((d) => addDays(d, -1) as TZDate)} aria-label="Previous day" className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
          <div role="radiogroup" aria-label="Day" className="flex flex-1 gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none]">
            {strip.map((d) => {
              const sel = isSameDay(d, day);
              // A dot marks a day with something on it. Never under the day
              // being shown: the list below is the answer.
              const has = busyDays.has(dayKey(d, tz)) && !sel;
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setDay(d)}
                  className={cn(
                    "flex min-w-[52px] flex-1 flex-col items-center gap-0.5 rounded-input py-2 transition-colors duration-150 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                    sel ? "bg-action text-on-action" : "bg-sheet text-text hover:bg-field",
                  )}
                >
                  <span className={cn("text-label", sel ? "text-on-action/80" : "text-text-2")}>{isSameDay(d, today) ? "Today" : format(d, "EEE")}</span>
                  <span className="text-small font-medium tabular">{format(d, "d")}</span>
                  <span className={cn("size-1 rounded-full", has ? "bg-text-3" : "bg-transparent")} aria-hidden />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setDay((d) => addDays(d, 1) as TZDate)} aria-label="Next day" className="grid size-9 shrink-0 place-items-center rounded-full text-text-2 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {providers.length > 1 || counts.length > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {providers.length > 1 ? (
              <div role="radiogroup" aria-label="Show" className="flex flex-wrap gap-1.5">
                {[{ id: "all", label: "Everyone" }, ...providers.map((p) => ({ id: p.id, label: p.name.split(" ").slice(0, 2).join(" ") }))].map((opt) => (
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
            ) : (
              <span />
            )}
            {/* Only worth showing when the day is mixed. On a day where
                everything is booked, the lead above has already said so. */}
            {counts.length > 1 ? (
              <p className="text-label text-text-2" aria-label="Summary">
                {counts.map(({ status, n }, i) => (
                  <Fragment key={status}>
                    {i ? <span aria-hidden> · </span> : null}
                    <span className="tabular">{n}</span> {statusLabel[status].toLowerCase()}
                  </Fragment>
                ))}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {ui === "loading" ? (
        <div className="overflow-hidden rounded-card bg-sheet" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-divider px-4 py-4 last:border-0">
              <Skeleton className="h-4 w-14 rounded-tag bg-field" />
              <Skeleton className="h-4 w-40 rounded-tag bg-field" />
              <Skeleton className="ml-auto hidden h-4 w-24 rounded-tag bg-field lg:block" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          // The heading above already names the day.
          title="Nothing booked"
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
        // One card, hairlines between rows, columns that line up down the day.
        <ol className="overflow-hidden rounded-card bg-sheet">
          {rows.map((r, i) => {
            const a = r.appointment;
            const dim = a.status === "cancelled" || a.status === "no_show" || a.status === "completed";
            return (
              <Fragment key={a.id}>
                {i === nowIndex ? (
                  <li aria-label="Now" className="flex items-center gap-3 border-b border-divider px-4 py-2 text-label text-text-2">
                    <span className="tabular">Now, {formatTime(now, tz)}</span>
                    <span className="h-px flex-1 bg-divider" />
                  </li>
                ) : null}
                <li className="border-b border-divider last:border-0">
                  <button
                    type="button"
                    onClick={() => setSelected(a.id)}
                    className={cn(
                      "grid w-full grid-cols-[76px_minmax(0,1fr)] items-start gap-x-3 gap-y-1 px-4 py-3.5 text-left",
                      // Columns only from the laptop breakpoint. At tablet
                      // width five of them squeeze the service into an
                      // ellipsis, and a stacked row reads better than that.
                      "lg:grid-cols-[88px_minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_auto_1rem] lg:items-center lg:gap-x-4",
                      "transition-colors duration-150 hover:bg-field/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none",
                    )}
                  >
                    <span className={cn("whitespace-nowrap text-small font-medium tabular", dim ? "text-text-2" : "text-text")}>{formatTime(a.startsAt, tz)}</span>

                    <span className="col-start-2 min-w-0">
                      <span className={cn("block truncate text-body font-medium", dim && "text-text-2", a.status === "cancelled" && "line-through decoration-1")}>
                        {r.pet?.name ?? "Pet"}
                        <span className="font-normal text-text-2">, {r.pet?.breed}</span>
                      </span>
                      <span className="block truncate text-small text-text-2">
                        {r.owner?.name}
                        {!r.owner?.mobile ? ", no mobile on file" : ""}
                      </span>
                    </span>

                    {/* Under the time on a phone, so the pet's name has the
                        whole width. Back in its column from the laptop up. */}
                    <span className="col-start-1 row-start-2 lg:col-start-5 lg:row-start-1">
                      <StatusPill status={a.status} size="sm" />
                    </span>

                    <span className="col-start-2 truncate text-small text-text-2 lg:col-start-3">
                      {r.service ? `${r.service.name}, ${r.service.durationMin} min` : <span className="italic">Walk-in, no service yet</span>}
                    </span>

                    <span className="col-start-2 truncate text-small text-text-2 lg:col-start-4">{r.provider?.name}</span>

                    <ChevronRight className="col-start-6 hidden size-4 text-text-3 lg:block" strokeWidth={1.5} aria-hidden />
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}

      <AppointmentDrawer orgSlug={org.slug} appointmentId={selected} onClose={() => setSelected(null)} onCancel={(id) => { setSelected(null); setCancelId(id); }} onReschedule={(id) => { setSelected(null); setRescheduleId(id); }} />
      <CancelDialog orgSlug={org.slug} appointment={appointments.find((a) => a.id === cancelId) ?? null} open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} />
      <RescheduleDialog orgSlug={org.slug} appointment={appointments.find((a) => a.id === rescheduleId) ?? null} open={!!rescheduleId} onOpenChange={(o) => !o && setRescheduleId(null)} onDone={showDayOf} />
      <NewAppointmentDialog orgSlug={org.slug} open={newOpen} onOpenChange={setNewOpen} day={day} onDone={showDayOf} />
      <WalkInDialog orgSlug={org.slug} open={walkInOpen} onOpenChange={setWalkInOpen} onDone={showDayOf} />
    </>
  );
}
