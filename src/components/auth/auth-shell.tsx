import Link from "next/link";
import type { ReactNode } from "react";
import { Lockup } from "@/components/primitives/lockup";
import { Photo } from "@/components/primitives/photo";
import { Sheet } from "@/components/primitives/surfaces";
import { NextAppointmentCard } from "./next-appointment-card";
import { cn } from "@/lib/utils";

// The three auth layouts from DESIGN.md in one component.
// Phone: the top 40 percent is the photograph with the white lockup, and a
// white sheet with 24 px top corners rises over it. When a field takes focus
// the photograph collapses to a 64 px band so the form fits above the keyboard.
// Tablet: the photograph fills the top third and a 480 px sheet overlaps it.
// Laptop: photograph left with one floating card and a caption, form right on
// the page with the lockup at top left.

export function AuthShell({
  children,
  showCard = true,
  photoCaption = "Photograph",
  className,
}: {
  children: ReactNode;
  showCard?: boolean;
  photoCaption?: string;
  className?: string;
}) {
  return (
    <div className={cn("group/auth min-h-dvh bg-page lg:grid lg:grid-cols-2", className)}>
      <div
        className={cn(
          "relative h-[40dvh] transition-[height] duration-250 ease-out motion-reduce:transition-none",
          "group-has-[input:focus]/auth:h-16 md:h-[33dvh] md:group-has-[input:focus]/auth:h-[33dvh]",
          "lg:h-auto lg:min-h-dvh",
        )}
      >
        <Photo className="absolute inset-0" caption={photoCaption} />
        <div className="absolute left-5 top-5 md:left-8 md:top-8 lg:hidden">
          <Lockup tone="inverse" size="md" href="/" />
        </div>
        {showCard ? (
          <div className="absolute left-1/2 top-1/2 hidden w-80 -translate-x-1/2 -translate-y-1/2 lg:block">
            <NextAppointmentCard />
          </div>
        ) : null}
        <p className="absolute bottom-10 left-10 hidden max-w-md text-heading text-white lg:block">
          Booking, records and recall for veterinary clinics in Northern Mindanao.
        </p>
      </div>

      <main className="relative -mt-6 lg:mt-0 lg:flex lg:min-h-dvh lg:flex-col">
        <div className="hidden lg:block lg:px-10 lg:pt-10">
          <Lockup href="/" />
        </div>
        <div className="mx-auto w-full md:max-w-[480px] lg:flex lg:max-w-[400px] lg:flex-1 lg:items-center lg:pb-24">
          <Sheet className="min-h-[60dvh] w-full rounded-b-none px-5 pb-10 pt-7 md:min-h-0 md:rounded-b-sheet md:px-8 md:py-8 lg:rounded-none lg:bg-transparent lg:p-0">
            {children}
          </Sheet>
        </div>
      </main>
    </div>
  );
}

export function AuthTitle({ children, lead }: { children: ReactNode; lead?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-title font-medium text-balance">{children}</h1>
      {lead ? <p className="mt-2 text-small text-text-2">{lead}</p> : null}
    </div>
  );
}

export function PrivacyFooter() {
  return (
    <p className="mt-8 text-center">
      <Link href="/privacy" className="text-small font-medium text-text hover:underline">
        Privacy
      </Link>
    </p>
  );
}
