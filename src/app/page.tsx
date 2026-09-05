import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";

// Temporary. The landing page arrives in phase P7. Until then the root points
// at the two entrances and the design sheet.

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-5 py-12">
      <Lockup size="lg" />
      <p className="text-body text-text-2">Booking, records and recall reminders for veterinary clinics in the Philippines. Landing page coming in the build.</p>
      <div className="flex flex-col gap-3">
        <Pill asChild block>
          <Link href="/sign-in">Staff sign in</Link>
        </Pill>
        <Pill asChild block variant="secondary">
          <Link href="/lunhaw">Book at the demo clinic</Link>
        </Pill>
        <Pill asChild block variant="text">
          <Link href="/design">Design sheet</Link>
        </Pill>
      </div>
    </main>
  );
}
