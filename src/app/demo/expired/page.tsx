import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";

export const metadata: Metadata = { title: "Sandbox expired", robots: { index: false } };

export default function ExpiredPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <Lockup href="/" />
      <div>
        <h1 className="text-title font-medium">Your sandbox has expired</h1>
        <p className="mt-2 text-body text-text-2">Sandboxes last 24 hours and are then deleted, along with everything typed into them. Start a fresh one in a click. It comes seeded and ready.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Pill asChild block>
          <Link href="/demo">Start a fresh sandbox</Link>
        </Pill>
        <Pill asChild block variant="secondary">
          <Link href="/">Back to Kalinga</Link>
        </Pill>
      </div>
    </main>
  );
}
