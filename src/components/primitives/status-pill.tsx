import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/domain/types";

// Status is never carried by colour alone. Every pill carries its label,
// completed adds a check, cancelled strikes the label through. The seven
// treatments are fixed in DESIGN.md. Nothing else gets a colour of its own.

export type StatusKey = AppointmentStatus | "overdue" | "due";

export const statusLabel: Record<StatusKey, string> = {
  booked: "Booked",
  confirmed: "Confirmed",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  overdue: "Overdue",
  due: "Due",
};

const treatment: Record<StatusKey, string> = {
  booked: "bg-pill-2 text-text",
  confirmed: "bg-tint text-text",
  arrived: "bg-action text-on-action",
  completed: "bg-pill-2 text-text-2",
  cancelled: "bg-pill-2 text-text-2 line-through decoration-1",
  no_show: "bg-status-noshow text-status-noshow-fg",
  overdue: "bg-status-overdue text-status-overdue-fg",
  due: "bg-tint text-text",
};

export function StatusPill({ status, className, size = "md" }: { status: StatusKey; className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap tabular-nums",
        size === "md" ? "h-7 px-2.5 text-[13px]" : "h-6 px-2 text-[12px]",
        treatment[status],
        className,
      )}
    >
      {status === "completed" ? <Check className="size-3.5" strokeWidth={2} aria-hidden /> : null}
      {statusLabel[status]}
    </span>
  );
}

/** The five appointment statuses staff can set from the day view, in the order they appear. */
export const staffStatuses: AppointmentStatus[] = ["booked", "confirmed", "arrived", "completed", "cancelled", "no_show"];
