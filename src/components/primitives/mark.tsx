import type { SVGProps } from "react";

// The Kalinga mark. Same geometry as public/brand/kalinga-mark.svg, inlined so
// it takes currentColor and needs no request. Do not redraw it. If the
// geometry changes, change the SVG file and copy the numbers here.

export function Mark({ title = "Kalinga", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="-128.2 -85.7 256.5 214" role="img" aria-label={title} fill="none" {...props}>
      <path d="M-97.8 20.8A100 100 0 0 0 88.3 46.9" stroke="currentColor" strokeWidth="29" strokeLinecap="round" />
      <circle cx="-83" cy="-44" r="28" fill="currentColor" />
      <circle cx="65" cy="-19" r="40" fill="currentColor" />
    </svg>
  );
}
