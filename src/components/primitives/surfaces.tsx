import type { ElementType, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// The two surfaces. A Sheet is the large white panel that rises over a
// photograph on auth pages, 24 px corners. A Card is the everyday white panel
// on the grey page, 20 px corners. Neither has a border or a shadow. Tone does
// the separating, so a Card placed on a Sheet must use the "field" tone.

export function Sheet({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-sheet rounded-sheet", className)} {...props}>
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
  tone = "sheet",
  as = "div",
  ...props
}: HTMLAttributes<HTMLElement> & { tone?: "sheet" | "field" | "tint"; as?: "div" | "section" | "article" | "li" }) {
  const tones = { sheet: "bg-sheet", field: "bg-field", tint: "bg-tint" };
  const Comp = as as ElementType;
  return (
    <Comp className={cn("rounded-card", tones[tone], className)} {...props}>
      {children}
    </Comp>
  );
}

/** A note from a colleague on onboarding steps. Never on sign in. */
export function GuideCard({
  name,
  initials,
  children,
  className,
  tone = "field",
}: {
  name: string;
  initials: string;
  children: ReactNode;
  className?: string;
  /** "auto" is for auth forms: field on the sheet, sheet on the page at laptop width. */
  tone?: "field" | "sheet" | "auto";
}) {
  const tones = { field: "bg-field", sheet: "bg-sheet", auto: "bg-field lg:bg-sheet" };
  const avatarTones = { field: "bg-sheet", sheet: "bg-field", auto: "bg-sheet lg:bg-field" };
  return (
    <div className={cn("flex gap-3 rounded-guide p-4", tones[tone], className)}>
      <span
        aria-hidden
        className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-medium text-text", avatarTones[tone])}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-text">{name}</p>
        <p className="text-[15px] leading-[1.4] text-text-2">{children}</p>
      </div>
    </div>
  );
}

/** Row inside a list of cards: label, optional secondary line, optional trailing content. */
export function Row({
  title,
  secondary,
  trailing,
  className,
  href,
  onClick,
  tone = "sheet",
}: {
  title: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  tone?: "sheet" | "field" | "auto";
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-[17px] leading-[1.35] text-text">{title}</div>
        {secondary ? <div className="mt-0.5 text-[15px] leading-[1.4] text-text-2">{secondary}</div> : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </>
  );
  const cls = cn(
    "flex w-full items-center gap-4 rounded-guide px-4 py-3.5 text-left",
    tone === "sheet" ? "bg-sheet" : tone === "field" ? "bg-field" : "bg-field lg:bg-sheet",
    (href || onClick) && "hover:bg-divider/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page transition-colors duration-150 motion-reduce:transition-none",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
