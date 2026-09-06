"use client";

import { placeholder } from "@/content/placeholders";
import Link from "next/link";
import { useState } from "react";
import { Sheet as Drawer, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Pill } from "@/components/primitives/pill";
import { StatusPill, statusLabel } from "@/components/primitives/status-pill";
import { TextareaField } from "@/components/primitives/field";
import { useToast } from "@/components/primitives/toast";
import { useOrg } from "@/lib/org-data";
import { joinAppointment } from "@/lib/domain/selectors";
import { can } from "@/lib/roles";
import { formatLongDate, formatPeso, formatTime, formatTimeWithZone } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/lib/domain/types";

// Everything about one appointment, and the actions the role is allowed. Front
// desk and owner manage it. A vet reads it and goes to the record.
//
// Nothing here saves as you touch it. The status and the note are a draft
// until Save changes, because this panel opens with a tap on a row and a
// misplaced tap used to mark a real client as not arrived.

// What each status can become, the current one first so it reads as the answer
// to "where is this appointment now".
const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  booked: ["booked", "confirmed", "arrived", "no_show"],
  confirmed: ["confirmed", "arrived", "no_show"],
  arrived: ["arrived", "completed"],
  completed: ["completed"],
  cancelled: ["cancelled", "booked"],
  no_show: ["no_show", "booked"],
};

function Body({
  appt,
  orgSlug,
  onCancel,
  onReschedule,
}: {
  appt: Appointment;
  orgSlug: string;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const { org, pets, owners, services, providers, role, dispatch } = useOrg(orgSlug);
  const toast = useToast();
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);
  const [note, setNote] = useState(appt.note ?? "");
  const [saving, setSaving] = useState(false);

  const row = joinAppointment({ pets, owners, services, providers }, appt);
  const manage = can(role, "manage_appointments");
  const tz = org.timezone;
  const choices = transitions[appt.status];
  const statusChanged = status !== appt.status;
  const noteChanged = note.trim() !== (appt.note ?? "").trim();
  const dirty = statusChanged || noteChanged;

  async function save() {
    setSaving(true);
    if (statusChanged) {
      const r = await dispatch({ type: "appointment/status", id: appt.id, status });
      if (!r.ok) return setSaving(false);
    }
    if (noteChanged) {
      const r = await dispatch({ type: "appointment/note", id: appt.id, note: note.trim() });
      if (!r.ok) return setSaving(false);
    }
    setSaving(false);
    toast({
      title: statusChanged ? `${row.pet?.name ?? "Appointment"} is now ${statusLabel[status].toLowerCase()}` : "Note saved",
      detail: statusChanged && noteChanged ? "The note was saved too." : undefined,
    });
  }

  function discard() {
    setStatus(appt.status);
    setNote(appt.note ?? "");
  }

  return (
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
          {row.owner?.mobile ? <span className="tabular">{row.owner.mobile}</span> : <span className="text-text-2">No mobile on file</span>}
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
        <>
          {choices.length > 1 ? (
            <div>
              <p id={`status-${appt.id}`} className="text-[13px] font-medium">
                Status
              </p>
              <div role="radiogroup" aria-labelledby={`status-${appt.id}`} className="mt-2 flex flex-wrap gap-2">
                {choices.map((s) => {
                  const selected = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "h-9 rounded-full px-3.5 text-[15px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
                        selected ? "bg-action text-on-action" : "bg-field text-text-2 hover:text-text",
                      )}
                    >
                      {s === "booked" && appt.status !== "booked" ? "Reopen" : statusLabel[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <TextareaField label="Note" hint="Optional" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder.appointmentNote} />

          <div className="flex flex-wrap items-center gap-2">
            <Pill size="sm" onClick={save} disabled={!dirty} loading={saving} loadingLabel="Saving">
              Save changes
            </Pill>
            {dirty ? (
              <>
                <Pill size="sm" variant="text" onClick={discard}>
                  Discard
                </Pill>
                <span className="text-label text-text-2">Not saved yet</span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {appt.status !== "completed" ? (
              <Pill size="sm" variant="secondary" onClick={() => onReschedule(appt.id)}>
                Reschedule
              </Pill>
            ) : null}
            {appt.status !== "cancelled" && appt.status !== "completed" ? (
              <Pill size="sm" variant="danger" onClick={() => onCancel(appt.id)}>
                Cancel appointment
              </Pill>
            ) : null}
          </div>
        </>
      ) : appt.note ? (
        <div>
          <p className="text-label font-medium">Note</p>
          <p className="mt-1 text-small">{appt.note}</p>
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
  );
}

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
  const { appointments } = useOrg(orgSlug);
  const appt = appointments.find((a) => a.id === appointmentId) ?? null;

  return (
    <Drawer open={!!appt} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-0 bg-sheet p-0 sm:max-w-md">
        {/* Keyed on the appointment so opening another one starts with its own draft. */}
        {appt ? <Body key={appt.id} appt={appt} orgSlug={orgSlug} onCancel={onCancel} onReschedule={onReschedule} /> : null}
      </SheetContent>
    </Drawer>
  );
}
