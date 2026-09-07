"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// A section that rises into place the first time it is scrolled to. Once, and
// never on the way back up, because a page that keeps animating as you scroll
// is a page you cannot read.
//
// The element is visible in the HTML. The hidden class goes on before paint,
// so nothing flashes, and nothing is lost when JavaScript does not run. No
// React state is involved: the observer touches the class list directly, which
// keeps the whole thing off the render path.

// useLayoutEffect warns when it runs on the server, and this component is
// rendered there. The layout timing is what avoids the flash, so it is used in
// the browser and quietly dropped everywhere else.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Reveal({ children, delay = 0, className, as: As = "div" }: { children: ReactNode; /** Milliseconds behind the element above it. Keep the stagger under 200. */ delay?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLDivElement>(null);

  useBeforePaint(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    el.classList.add("reveal-hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.remove("reveal-hidden");
        observer.disconnect();
      },
      // Bottom: a little way in, so the reveal happens as the section arrives
      // rather than the instant its first pixel appears. Top: three screens of
      // slack, because a single jump past a section, an anchor link or a
      // restored scroll position, can otherwise skip the intersection
      // entirely and leave that section invisible for good. With the slack it
      // is already revealed long before anyone scrolls back up to it.
      { rootMargin: "300% 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <As ref={ref as never} className={cn("reveal", className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </As>
  );
}
