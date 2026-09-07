import { Check, Copy } from "lucide-react";
import { StatusPill, type StatusKey } from "@/components/primitives/status-pill";
import { preview } from "@/content/landing";
import { renderReminder } from "@/content/templates";
import { cn } from "@/lib/utils";

// The product, drawn rather than photographed. These are built from the same
// tokens and the same status pills the real screens use, so they stay true when
// the palette changes, they are sharp on any display, they weigh nothing, and
// they follow the reader into dark mode. A screenshot does none of that and
// starts going stale the day it is taken.
//
// Every name in them is invented and lives in src/content/landing.ts. Nothing
// here touches the database.

/** The chrome a product shot sits in. Not a real browser, just enough of one. */
export function Frame({ children, className, url }: { children: React.ReactNode; className?: string; url?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-divider bg-page", className)}>
      <div className="flex items-center gap-2 border-b border-divider px-3 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2 rounded-full bg-divider" />
          <span className="size-2 rounded-full bg-divider" />
          <span className="size-2 rounded-full bg-divider" />
        </span>
        {url ? <span className="ml-1 truncate rounded-tag bg-sheet px-2 py-0.5 text-[11px] tabular text-text-3">{url}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** The day view: the strip, then the morning. */
export function DayPreview({ compact = false }: { compact?: boolean }) {
  const { day } = preview;
  return (
    <div className={cn("flex flex-col gap-3", compact ? "p-3" : "p-4")}>
      {!compact ? (
        <div>
          <p className="text-small font-medium">{day.label}</p>
          <p className="text-[11px] text-text-2">Times in PHT.</p>
        </div>
      ) : null}
      <ol className="flex gap-1" aria-hidden>
        {day.days.map((d) => (
          <li
            key={d.date}
            className={cn(
              "flex flex-1 flex-col items-center rounded-input py-1.5 text-[11px] leading-tight",
              "today" in d && d.today ? "bg-action text-on-action" : "bg-sheet text-text-2",
            )}
          >
            <span>{d.day}</span>
            <span className="text-[13px] font-medium tabular">{d.date}</span>
          </li>
        ))}
      </ol>
      <ol className="overflow-hidden rounded-guide bg-sheet">
        {day.rows.map((r, i) => (
          <li key={r.time} className={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t border-divider")}>
            <span className="w-16 shrink-0 text-[12px] tabular text-text-2">{r.time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-small font-medium leading-tight">{r.pet}</span>
              <span className="block truncate text-[11px] leading-tight text-text-2">{r.owner}</span>
            </span>
            <span className="hidden shrink-0 text-[12px] text-text-2 sm:block">{r.service}</span>
            <StatusPill status={r.status as StatusKey} size="sm" className="shrink-0" />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** What a pet owner sees on their phone, in a phone. */
export function BookingPreview() {
  const { booking } = preview;
  return (
    <div className="mx-auto w-[248px] overflow-hidden rounded-[32px] border-[6px] border-text bg-page">
      <div className="flex flex-col gap-3 p-3">
        <div>
          <p className="text-small font-medium leading-tight">When suits you?</p>
          <p className="mt-0.5 text-[11px] leading-tight text-text-2">{booking.service}</p>
        </div>
        <p className="text-[11px] font-medium">{booking.day}</p>
        <div className="grid grid-cols-2 gap-1.5" aria-hidden>
          {booking.slots.map((s) => (
            <span key={s} className={cn("rounded-input py-2 text-center text-[12px] tabular", s === booking.chosen ? "bg-action text-on-action" : "bg-sheet text-text")}>
              {s}
            </span>
          ))}
        </div>
        <span className="rounded-full bg-action py-2 text-center text-[12px] font-medium text-on-action">Continue</span>
      </div>
    </div>
  );
}

/** The Monday queue. */
export function RecallPreview() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-small font-medium">Due this week</p>
      <ol className="overflow-hidden rounded-guide bg-sheet">
        {preview.due.map((d, i) => (
          <li key={d.pet} className={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t border-divider")}>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-small font-medium leading-tight">
                {d.pet} <span className="font-normal text-text-2">{d.breed}</span>
              </span>
              <span className="block truncate text-[11px] leading-tight text-text-2">{d.kind}</span>
            </span>
            <StatusPill status={d.when === "Overdue" ? "overdue" : "due"} size="sm" className="shrink-0" />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The message the desk copies. The one thing on the page worth reading twice. */
export function MessageCard({ className }: { className?: string }) {
  const m = preview.message;
  const text = renderReminder("vaccination", {
    petName: m.pet,
    ownerName: m.owner.split(" ")[0],
    clinicName: preview.clinic,
    dueOn: "2026-10-02",
    bookingUrl: "kalinga.cjjutba.dev/lunhaw",
  });
  return (
    <div className={cn("rounded-sheet bg-sheet p-5 md:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-medium">
            {m.pet}
            <span className="font-normal text-text-2">, {m.breed}</span>
          </p>
          <p className="mt-0.5 truncate text-small text-text-2">
            {m.owner}, <span className="tabular">{m.mobile}</span>
          </p>
        </div>
        <StatusPill status="due" className="shrink-0" />
      </div>
      <blockquote className="mt-4 rounded-guide bg-page p-4 text-small leading-[1.55]">{text}</blockquote>
      <div className="mt-4 flex flex-wrap gap-2" aria-hidden>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-pill-2 px-3.5 text-small font-medium">
          <Copy className="size-3.5" strokeWidth={1.5} /> Copy message
        </span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-action px-3.5 text-small font-medium text-on-action">
          <Check className="size-3.5" strokeWidth={2} /> Mark sent
        </span>
      </div>
    </div>
  );
}

export const previews = {
  booking: <BookingPreview />,
  day: (
    <Frame url="kalinga.cjjutba.dev/app">
      <DayPreview compact />
    </Frame>
  ),
  recall: (
    <Frame url="kalinga.cjjutba.dev/app">
      <RecallPreview />
    </Frame>
  ),
};
