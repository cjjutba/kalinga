"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet as Drawer, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Pill } from "@/components/primitives/pill";
import { StatusPill } from "@/components/primitives/status-pill";
import { TextareaField } from "@/components/primitives/field";
import { useOrg } from "@/lib/mock/store";
import { joinAppointment } from "@/lib/mock/selectors";
import { can } from "@/lib/roles";
import { formatLongDate, formatPeso, formatTime, formatTimeWithZone } from "@/lib/time";

// Everything about one appointment, and the actions the role is allowed. Front
// desk and owner manage it. A vet reads it and goes to the record.

export function AppointmentDrawer({
  orgSlug,
  appointmentId,
  onClose,
  onCancel,
  onReschedule,
}: {
  orgSlug: string;
  appointmentId: string | null;
  onClose: () => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const { org, appointments, pets, owners, services, providers, role, dispatch } = useOrg(orgSlug);
  const appt = appointments.find((a) => a.id === appointmentId) ?? null;
  const [note, setNote] = useState<string | null>(null);
  const row = appt ? joinAppointment({ pets, owners, services, providers }, appt) : null;
  const manage = can(role, "manage_appointments");
  const tz = org.timezone;

  const setStatus = (status: "confirmed" | "arrived" | "completed" | "no_show" | "booked") => {
    if (!appt) return;
    dispatch({ type: "appointment/status", id: appt.id, status });
  };

  return (
    <Drawer open={!!appt} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-0 bg-sheet p-0 sm:max-w-md">
        {row && appt ? (
          <div className="flex flex-col gap-6 p-6">
            <SheetHeader className="p-0 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-heading font-medium">
                    {row.pet?.name ?? "Pet"}
                    <span className="text-text-2">, {row.pet?.breed}</span>
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-small text-text-2">{row.owner?.name}</SheetDescription>
                </div>
                <StatusPill status={appt.status} />
              </div>
            </SheetHeader>

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-small">
              <dt className="text-text-2">When</dt>
              <dd className="tabular">
                {formatLongDate(appt.startsAt, tz)}
                <br />
                {formatTimeWithZone(appt.startsAt, tz)} to {formatTime(appt.endsAt, tz)}
              </dd>
              <dt className="text-text-2">Service</dt>
              <dd>{row.service ? `${row.service.name}, ${row.service.durationMin} min, ${formatPeso(row.service.pricePhp)}` : "Walk-in, no service chosen yet"}</dd>
              <dt className="text-text-2">With</dt>
              <dd>{row.provider?.name}</dd>
              <dt className="text-text-2">Owner</dt>
              <dd>
                {row.owner?.name}
                <br />
                {row.owner?.mobile ? <span className="tabular">{row.owner.mobile}</span> : <span className="text-text-3">No mobile on file</span>}
                {row.owner?.email ? (
                  <>
                    <br />
                    {row.owner.email}
                  </>
                ) : null}
              </dd>
              <dt className="text-text-2">Booked</dt>
              <dd>
                {appt.source === "online" ? "Online" : appt.source === "staff" ? "At the desk" : "Walk-in"}, reference <span className="tabular">{appt.reference}</span>
              </dd>
              {appt.cancelReason ? (
                <>
                  <dt className="text-text-2">Cancelled</dt>
                  <dd>{appt.cancelReason}</dd>
                </>
              ) : null}
            </dl>

            {manage ? (
              <TextareaField
                label="Note"
                hint="Optional"
                rows={2}
                value={note ?? appt.note ?? ""}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => note !== null && dispatch({ type: "appointment/note", id: appt.id, note })}
              />
            ) : appt.note ? (
              <div>
                <p className="text-label font-medium">Note</p>
                <p className="mt-1 text-small">{appt.note}</p>
              </div>
            ) : null}

            {manage ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {appt.status === "booked" ? (
                    <Pill size="sm" onClick={() => setStatus("confirmed")}>
                      Confirm
                    </Pill>
                  ) : null}
                  {appt.status === "booked" || appt.status === "confirmed" ? (
                    <Pill size="sm" onClick={() => setStatus("arrived")}>
                      Mark arrived
                    </Pill>
                  ) : null}
                  {appt.status === "arrived" ? (
                    <Pill size="sm" onClick={() => setStatus("completed")}>
                      Mark completed
                    </Pill>
                  ) : null}
                  {appt.status === "booked" || appt.status === "confirmed" ? (
                    <Pill size="sm" variant="secondary" onClick={() => setStatus("no_show")}>
                      No-show
                    </Pill>
                  ) : null}
                  {appt.status === "cancelled" || appt.status === "no_show" ? (
                    <Pill size="sm" variant="secondary" onClick={() => setStatus("booked")}>
                      Reopen
                    </Pill>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {appt.status !== "completed" ? (
                    <Pill size="sm" variant="secondary" onClick={() => onReschedule(appt.id)}>
                      Reschedule
                    </Pill>
                  ) : null}
                  {appt.status !== "cancelled" && appt.status !== "completed" ? (
                    <Pill size="sm" variant="text" onClick={() => onCancel(appt.id)}>
                      Cancel appointment
                    </Pill>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 border-t border-divider pt-5">
              {row.pet ? (
                <Pill asChild size="sm" variant={can(role, "add_visit") ? "primary" : "secondary"} block>
                  <Link href={`/app/${org.slug}/pets/${row.pet.id}${can(role, "add_visit") && appt.status === "arrived" ? "/visit?appointment=" + appt.id : ""}`}>
                    {can(role, "add_visit") && appt.status === "arrived" ? "Add today's visit" : "Open pet record"}
                  </Link>
                </Pill>
              ) : null}
              {row.owner ? (
                <Pill asChild size="sm" variant="text" block>
                  <Link href={`/app/${org.slug}/clients/${row.owner.id}`}>Open client</Link>
                </Pill>
              ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Drawer>
  );
}
