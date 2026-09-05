import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { Photo } from "@/components/primitives/photo";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import type { getPublicClinic } from "@/lib/db/queries";
import { formatPeso, zoneLabel } from "@/lib/time";

export type PublicClinic = NonNullable<Awaited<ReturnType<typeof getPublicClinic>>>;

// A clinic's public page. Name, where, when, what can be booked, one button.
// Mobile first: the button is in thumb reach and everything else can wait.

function hoursLabel(from: string, to: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return m ? `${hh}:${String(m).padStart(2, "0")} ${suffix}` : `${hh} ${suffix}`;
  };
  return `${fmt(from)} to ${fmt(to)}`;
}

export function ClinicNotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col justify-center gap-4 px-5 py-12 text-center">
      <h1 className="text-title font-medium">That clinic is not on Kalinga</h1>
      <p className="text-body text-text-2">Check the link the clinic shared with you. Booking addresses look like kalinga.cjjutba.dev/lunhaw.</p>
    </main>
  );
}

export function ClinicPage({ data }: { data: PublicClinic }) {
  const { organisation: org, services, providers } = data;
  const bookable = services.length > 0 && providers.length > 0;
  return (
    <main className="mx-auto w-full max-w-xl">
      <Photo className="h-56 rounded-b-sheet md:mt-6 md:h-72 md:rounded-sheet" caption="Photograph, the clinic's own" />
      <div className="px-5 pt-6">
        <h1 className="text-title font-medium text-balance">{org.name}</h1>
        <ul className="mt-3 flex flex-col gap-2 text-small text-text-2">
          {org.address ? (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              {org.address}
            </li>
          ) : null}
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            Open {hoursLabel(org.openFrom, org.openTo)} {zoneLabel(org.timezone)}
          </li>
          {org.mobile ? (
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="tabular">{org.mobile}</span>
            </li>
          ) : null}
        </ul>

        <div className="mt-6">
          {bookable ? (
            <>
              <Pill asChild block>
                <Link href={`/${org.slug}/book`}>Book an appointment</Link>
              </Pill>
              <p className="mt-2 text-center text-label text-text-2">Under a minute. No account needed.</p>
            </>
          ) : (
            <Card className="p-4 text-small text-text-2">Online booking is not open yet. {org.mobile ? `Call the clinic on ${org.mobile}.` : "Call the clinic to book."}</Card>
          )}
        </div>

        {services.length ? (
          <section className="mt-8" aria-labelledby="services">
            <h2 id="services" className="text-heading font-medium">
              Services
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {services.map((s) => (
                <li key={s.id}>
                  <Card className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <span>
                      <span className="block text-body font-medium">{s.name}</span>
                      <span className="block text-small text-text-2">{s.durationMin} minutes</span>
                    </span>
                    <span className="text-body tabular">{formatPeso(s.pricePhp)}</span>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {providers.length ? (
          <section className="mt-8" aria-labelledby="team">
            <h2 id="team" className="text-heading font-medium">
              Who you will see
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {providers.map((v) => (
                <li key={v.id}>
                  <Card className="flex flex-col items-center gap-2 p-4 text-center">
                    <Photo className="size-16 rounded-full" caption="" />
                    <span className="text-small font-medium leading-tight">{v.name}</span>
                    <span className="text-label text-text-2">{v.title}</span>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 rounded-card bg-tint p-5" aria-labelledby="recall">
          <h2 id="recall" className="text-body font-medium">
            We will remind you
          </h2>
          <p className="mt-1 text-small text-text-2">Vaccinations are yearly, deworming every three months, grooming every few weeks. The clinic keeps track and messages you when your pet is due, so you do not have to remember.</p>
        </section>
      </div>
    </main>
  );
}
