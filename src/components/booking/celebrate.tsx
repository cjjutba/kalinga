"use client";

import { useEffect } from "react";

// The one piece of decoration in the product, and it fires once: the moment a
// pet owner's booking lands. Not when they open the same link again later to
// check the time, which is why the flag is stripped from the address as soon
// as it has been used.
//
// It takes its colours from the tokens on the document, so it follows the
// theme and adds no colour of its own, and it does nothing at all for anyone
// who asked for less motion.

// Pale tokens vanish on a white page, so only the three that read take part.
const TOKENS = ["--action", "--text-2", "--tint"];

export function Celebrate({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const timers: number[] = [];

    void (async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) return;

      const style = getComputedStyle(document.documentElement);
      const colors = TOKENS.map((t) => style.getPropertyValue(t).trim()).filter(Boolean);
      // Two cannons at the top corners, falling across the page rather than
      // bursting out of the middle of what someone is trying to read.
      const fall = (particleCount: number, startVelocity: number) => {
        for (const x of [0.2, 0.8]) {
          confetti({
            particleCount,
            startVelocity,
            colors,
            angle: x < 0.5 ? 300 : 240,
            spread: 70,
            scalar: 0.9,
            gravity: 0.9,
            ticks: 260,
            origin: { x, y: 0 },
            disableForReducedMotion: true,
          });
        }
      };

      fall(26, 34);
      timers.push(window.setTimeout(() => !cancelled && fall(16, 26), 220));

      // Take the flag out of the address so a reload, or the bookmark the page
      // asks people to keep, does not set it off again.
      const url = new URL(window.location.href);
      url.searchParams.delete("booked");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [active]);

  return null;
}
