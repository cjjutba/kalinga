import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-col gap-6 border-t border-divider pt-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Lockup size="sm" href="/" />
          <p className="mt-2 max-w-sm text-label text-text-2">Kalinga is Filipino for tender care. Booking, records and recall reminders for veterinary clinics in the Philippines, starting with Northern Mindanao.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-small">
          <Link href="/demo" className="text-text-2 hover:text-text">
            Demo
          </Link>
          <Link href="/lunhaw" className="text-text-2 hover:text-text">
            Sample booking page
          </Link>
          <Link href="/sign-in" className="text-text-2 hover:text-text">
            Staff sign in
          </Link>
          <Link href="/privacy" className="text-text-2 hover:text-text">
            Privacy
          </Link>
          <Link href="/privacy/request" className="text-text-2 hover:text-text">
            Delete my data
          </Link>
        </nav>
      </div>
      <p className="mt-8 text-label text-text-2">All rights reserved. Built in Cagayan de Oro.</p>
    </footer>
  );
}
