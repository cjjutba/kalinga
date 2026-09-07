import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";

// Four columns and the mark. A thin footer on a page that asks somebody to
// trust you with their clients' phone numbers reads as a page that might not
// be there next year.

const columns = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Recall", href: "/#recall" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Questions", href: "/#faq" },
    ],
  },
  {
    heading: "Start",
    links: [
      { label: "Create your clinic", href: "/sign-up" },
      { label: "Staff sign in", href: "/sign-in" },
      { label: "Ask about a pilot", href: "/#pricing" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy notice", href: "/privacy" },
      { label: "Delete my data", href: "/privacy/request" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 pb-12 md:px-8">
      <div className="grid gap-10 border-t border-divider pt-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-8">
        <div>
          <Lockup size="sm" href="/" />
          <p className="mt-3 max-w-xs text-small text-text-2">Kalinga is Filipino for tender care. Booking, records and recall reminders for veterinary clinics in the Philippines, starting with Northern Mindanao.</p>
        </div>
        {columns.map((c) => (
          <nav key={c.heading} aria-label={c.heading}>
            <h2 className="text-label font-medium text-text-2">{c.heading}</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="rounded-tag text-small text-text-2 transition-colors duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mt-10 border-t border-divider pt-6 text-label text-text-2">All rights reserved. Built in Cagayan de Oro.</p>
    </footer>
  );
}
