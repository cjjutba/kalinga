import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/domain/selectors";

// Two small marks that make a list of records scannable.
//
// A badge carries the first letters of a name, so the eye has something to
// land on down a column of similar rows. A tag names a related record, a pet
// against its owner, and reads as a thing rather than as text in a sentence.

export function InitialBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-field text-[12px] font-medium text-text-2", className)}>
      {initials(name)}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex max-w-full items-center truncate rounded-tag bg-field px-2 py-0.5 text-label text-text", className)}>{children}</span>;
}
