import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/staff/page-header";

export const metadata: Metadata = { title: "Not for your role" };

// Rendered with a 403 when a page calls forbidden(). The layout above has
// already confirmed the membership, so the person is staff at this clinic and
// simply holds a role this page is not part of.

export default function Forbidden() {
  return (
    <EmptyState
      title="This page is not part of your role"
      lead="The server checks every request, so nothing here was loaded. Ask the clinic owner if you need it."
      action={
        <Link href="/app" className="inline-flex h-10 items-center rounded-full bg-pill-2 px-4 text-small font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          Back to today
        </Link>
      }
    />
  );
}
