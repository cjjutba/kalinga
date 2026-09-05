import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <Lockup href="/" />
      <div>
        <h1 className="text-title font-medium">That page does not exist</h1>
        <p className="mt-2 text-body text-text-2">
          The link may be old, or the clinic may have changed its booking address. Nothing has been lost.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Pill asChild block>
          <Link href="/">Back to Kalinga</Link>
        </Pill>
        <Pill asChild block variant="secondary">
          <Link href="/sign-up">Create your clinic</Link>
        </Pill>
      </div>
    </main>
  );
}
