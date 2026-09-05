import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";
import { Photo } from "@/components/primitives/photo";
import { Card } from "@/components/primitives/surfaces";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DemoStart } from "./demo-start";

export const metadata: Metadata = {
  title: "Try the demo clinic",
  robots: { index: false, follow: true },
};

// The only place a sandbox is created, and only by the button, which is a
// POST. A crawler landing here creates nothing. The page explains the two
// demo surfaces so a visitor knows which one they are in.

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex w-full max-w-5xl items-center px-5 py-5 md:px-8">
        <Lockup href="/" />
      </header>
      <main className="mx-auto grid w-full max-w-5xl gap-8 px-5 pb-16 pt-6 md:grid-cols-2 md:items-start md:px-8">
        <div>
          <h1 className="text-title font-medium text-balance">Click through a working clinic</h1>
          <p className="mt-4 text-body text-text-2">Lunhaw Animal Clinic is invented. Its sixteen appointments today, its clients and its pets are all fictional, and it is yours for the next 24 hours. Book, cancel, add a visit, work the recall queue, switch between every role. Nothing you do is visible to the next visitor, and nothing is sent to anyone.</p>
          <DemoStart />
          <p className="mt-4 text-label text-text-2">Your sandbox is deleted after 24 hours. It sends no email and no text.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-body font-medium">The staff side</p>
              <p className="mt-1 text-small text-text-2">Owner, vet and front desk. The day view, records, recall and settings.</p>
            </Card>
            <Card className="p-4">
              <p className="text-body font-medium">The pet owner side</p>
              <p className="mt-1 text-small text-text-2">
                Book without an account on the{" "}
                <Link href="/lunhaw" className="font-medium text-text hover:underline">
                  clinic&apos;s public page
                </Link>
                , then manage the booking from the link.
              </p>
            </Card>
          </div>
        </div>
        <Photo className="aspect-[4/5] rounded-sheet" caption="Photograph, a cat at a window" />
      </main>
      <SiteFooter />
    </div>
  );
}
