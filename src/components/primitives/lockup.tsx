import Link from "next/link";
import { Mark } from "./mark";
import { cn } from "@/lib/utils";

// Mark beside the wordmark, in the interface font. DESIGN.md: the mark is 1.6
// times the cap height and sits half a cap height left of the K. With Inter's
// cap height at 0.727 em that is a mark 1.16 em tall and a 0.36 em gap.

export function Lockup({
  className,
  size = "md",
  href,
  tone = "default",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  /** "inverse" is white, for photographs and dark panels regardless of theme. */
  tone?: "default" | "inverse";
}) {
  const fontSize = { sm: "text-[17px]", md: "text-[22px]", lg: "text-[28px]" }[size];
  const body = (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-[-0.02em] leading-none select-none",
        fontSize,
        tone === "inverse" ? "text-white" : "text-text",
        className,
      )}
    >
      <Mark className="h-[1.16em] w-auto shrink-0 translate-y-[0.06em]" aria-hidden title="" />
      <span className="ml-[0.36em]">Kalinga</span>
    </span>
  );
  if (href) {
    return (
      <Link href={href} aria-label="Kalinga home" className="inline-flex rounded-tag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
        {body}
      </Link>
    );
  }
  return body;
}
