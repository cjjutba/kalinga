import type { ReactNode } from "react";

// The public side. No staff shell, and no footer here: the clinic pages carry
// their own, and the booking flow keeps those links in its rail.

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-page">{children}</div>;
}
