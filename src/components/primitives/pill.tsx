"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The button. DESIGN.md: full pills, 52 px on phone, a near black primary,
// a grey secondary, plain text tertiary. Loading is a spinner inside the pill,
// never a disabled grey. Focus is a 2 px ring with a 2 px offset.

const pill = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none",
    "transition-colors duration-150 motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
    "disabled:opacity-60 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-action text-on-action hover:bg-action-pressed active:bg-action-pressed",
        secondary: "bg-pill-2 text-text hover:bg-divider active:bg-divider",
        text: "bg-transparent text-text hover:bg-pill-2/60 active:bg-pill-2",
        danger: "bg-status-noshow text-status-noshow-fg hover:opacity-90",
      },
      size: {
        md: "h-[52px] px-6 text-[17px] md:h-12",
        sm: "h-10 px-4 text-[15px]",
        xs: "h-8 px-3 text-[13px]",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof pill> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export const Pill = forwardRef<HTMLButtonElement, PillProps>(function Pill(
  { className, variant, size, block, asChild, loading, loadingLabel, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      className={cn(pill({ variant, size, block }), className)}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { pill as pillVariants };
