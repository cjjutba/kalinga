import type { ReactNode } from "react";
import Link from "next/link";
import { Mark } from "@/components/primitives/mark";

// The public side. No staff shell. The clinic's name leads
// and Kalinga sits quietly at the bottom, because the pet owner came to book
// with their vet, not with us.

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-page">
      {children}
      <footer className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-5 py-8 text-label text-text-2">
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-text">
          <Mark className="h-3.5 w-auto" aria-hidden title="" /> Booking by Kalinga
        </Link>
        <Link href="/privacy" className="hover:text-text">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
