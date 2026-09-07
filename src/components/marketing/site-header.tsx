"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { cn } from "@/lib/utils";

// Sticky, and quiet until you leave the top of the page. The hairline and the
// blurred ground appear together, so the header reads as part of the hero at
// rest and as a bar over the page once you scroll.
//
// The anchors are the page's spine. They are hidden on a phone rather than
// stuffed into a menu: four links to sections on the same page do not earn a
// sheet, and both buttons stay reachable at every width.

const anchors = [
  { label: "How it works", href: "#how" },
  { label: "Recall", href: "#recall" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#faq" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200 motion-reduce:transition-none",
        scrolled ? "border-b border-divider bg-page/85 backdrop-blur" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Lockup href="/" size="sm" />
        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {anchors.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="rounded-full px-3 py-2 text-small text-text-2 transition-colors duration-150 hover:bg-sheet hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
            >
              {a.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center rounded-full px-3 text-small font-medium text-text transition-colors duration-150 hover:bg-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
          >
            Sign in
          </Link>
          <Pill asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Pill>
        </div>
      </div>
    </header>
  );
}
