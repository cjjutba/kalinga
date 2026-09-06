import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// The list surface for records: one row per thing, columns that line up, and
// hairlines doing the separating inside a single card. A whole row is the link
// to the record, drawn once as a stretched anchor so a screen reader hears one
// link per row and not one per column. Columns that do not fit a phone are
// marked hidden by their own class, and the first column carries the same
// facts on a second line at that width.

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Applies to the header cell and every body cell. Hide with "hidden md:table-cell". */
  className?: string;
  /** Right aligned for numbers, counts and trailing controls. */
  align?: "right";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  rowLabel,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** When given, the whole row opens this link. */
  rowHref?: (row: T) => string;
  /** The accessible name of the row link. Defaults to the first column's text. */
  rowLabel?: (row: T) => string;
  className?: string;
}) {
  const linked = Boolean(rowHref);
  return (
    <div className={cn("overflow-hidden rounded-card bg-sheet", className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-divider">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn("px-4 py-2.5 text-label font-medium text-text-2", c.align === "right" && "text-right", c.className)}
              >
                {c.header}
              </th>
            ))}
            {linked ? <th scope="col" className="w-10 px-2 py-2.5"><span className="sr-only">Open</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn(
                "relative border-b border-divider last:border-0",
                linked && "transition-colors duration-150 hover:bg-field/70 focus-within:bg-field/70 motion-reduce:transition-none",
              )}
            >
              {columns.map((c, i) => (
                <td key={c.key} className={cn("px-4 py-3 align-middle text-small", c.align === "right" && "text-right", c.className)}>
                  {i === 0 && rowHref ? (
                    <Link
                      href={rowHref(row)}
                      aria-label={rowLabel?.(row)}
                      className="rounded-tag after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet"
                    >
                      {c.cell(row)}
                    </Link>
                  ) : (
                    c.cell(row)
                  )}
                </td>
              ))}
              {linked ? (
                <td className="w-10 px-2 py-3 align-middle">
                  <ChevronRight className="size-4 text-text-3" strokeWidth={1.5} aria-hidden />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The skeleton shown while a list loads, shaped like the table above. */
export function TableSkeleton({ rows = 5, columns = 3 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-card bg-sheet" aria-busy>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-divider px-4 py-3.5 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className={cn("h-4 rounded-tag bg-field", c === 0 ? "w-40" : "w-24", c > 0 && "hidden md:block")} />
          ))}
        </div>
      ))}
    </div>
  );
}
