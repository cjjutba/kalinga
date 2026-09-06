import Link from "next/link";
import { Mark } from "@/components/primitives/mark";

// The pet owner came to book with their vet, not with us, so Kalinga sits at
// the bottom of the clinic's pages and nowhere near the booking itself. The
// booking flow carries these two links in its own rail instead, because a
// footer under a full height panel is a scrollbar for nothing.

export function PublicFooter({ className }: { className?: string }) {
  return (
    <footer className={className ?? "mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-8 text-label text-text-2 md:px-6"}>
      <Link href="/" className="inline-flex items-center gap-1.5 rounded-tag hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <Mark className="h-3.5 w-auto" aria-hidden title="" /> Booking by Kalinga
      </Link>
      <Link href="/privacy" className="rounded-tag hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        Privacy
      </Link>
    </footer>
  );
}
