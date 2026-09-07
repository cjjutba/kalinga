import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Photo } from "@/components/primitives/photo";
import { Pill } from "@/components/primitives/pill";
import { StatusPill } from "@/components/primitives/status-pill";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PilotForm } from "@/components/marketing/pilot-form";
import { Reveal } from "@/components/marketing/reveal";
import { DayPreview, Frame, MessageCard, previews } from "@/components/marketing/previews";
import { landing } from "@/content/landing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kalinga, booking and recall for vet clinics",
  description: landing.hero.lead,
};

// The landing page. Eleven sections in one column, and the order is the
// argument: what it is, that it is real, the problem, how it works, the part
// that earns, why it fits here, what it costs, what you are still wondering,
// and the way in.
//
// The rhythm is deliberate. Sections are separated by 96 px on a phone and
// 160 px from the laptop up, and only two things on the page are allowed to be
// loud: the headline and the sentence about the dog vaccinated in March.

const section = "mx-auto w-full max-w-6xl px-5 md:px-8";
const gap = "py-24 lg:py-40";

function Eyebrow({ children }: { children: string }) {
  return <p className="text-label font-medium uppercase tracking-[0.08em] text-text-2">{children}</p>;
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader />

      <main>
        {/* The hero owns the first screen. The photograph runs to the top of
            the page behind the header and off the right edge, and the day view
            sits over the seam so the two read as one image. */}
        <section className="relative lg:-mt-16">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
            <Photo src="/marketing/aspin-clinic.webp" alt="An aspin sitting in the light of a clinic window" priority sizes="46vw" className="h-full w-full [&_img]:object-[70%_center]" />
          </div>

          <div className={cn(section, "relative grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pb-28 lg:pt-36")}>
            <Reveal className="max-w-xl">
              <h1 className="text-[38px] font-medium leading-[1.05] tracking-[-0.02em] text-balance sm:text-[46px] lg:text-[52px]">{landing.hero.title}</h1>
              <p className="mt-6 max-w-lg text-body leading-[1.55] text-text-2">{landing.hero.lead}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Pill asChild>
                  <Link href={landing.hero.primary.href}>
                    {landing.hero.primary.label} <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                </Pill>
                <Pill asChild variant="secondary">
                  <Link href={landing.hero.secondary.href}>{landing.hero.secondary.label}</Link>
                </Pill>
              </div>
            </Reveal>

            <Reveal delay={120} className="relative">
              {/* On a phone and a tablet the photograph is a band under the
                  words rather than a bleed beside them. */}
              <Photo src="/marketing/aspin-clinic.webp" alt="An aspin sitting in the light of a clinic window" sizes="100vw" className="aspect-[4/3] rounded-sheet sm:aspect-[16/10] lg:hidden" />
              <div className="relative -mt-16 px-2 sm:-mt-24 sm:px-8 lg:mt-0 lg:px-0">
                <Frame url="kalinga.cjjutba.dev/app" className="shadow-lifted lg:-rotate-[1.5deg]">
                  <DayPreview />
                </Frame>
                <div className="absolute -bottom-5 left-4 w-56 rounded-card bg-tint p-4 shadow-lifted sm:left-10 lg:-left-8" aria-hidden>
                  <p className="text-label font-medium text-text-2">Next appointment</p>
                  <p className="mt-1 text-small font-medium">Kiko, 9:30 AM</p>
                  <StatusPill status="confirmed" size="sm" className="mt-2 bg-page" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Three facts, not a logo wall. There are no customers yet. */}
        <section className={section} aria-label="At a glance">
          <ul className="grid grid-cols-1 gap-4 border-y border-divider py-6 text-small text-text-2 sm:grid-cols-3 sm:gap-8">
            {landing.facts.map((f) => (
              <li key={f} className="sm:text-center">
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* The argument, alone and loud. */}
        <section className={cn(section, gap)} aria-labelledby="problem">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 id="problem" className="text-label font-medium uppercase tracking-[0.08em] text-text-2">
              {landing.problem.title}
            </h2>
            <p className="mt-6 text-[26px] font-medium leading-[1.25] tracking-[-0.015em] text-balance sm:text-[32px] lg:text-[38px]">{landing.problem.body}</p>
          </Reveal>
        </section>

        {/* How it works. The interface stays on the left in all three rows. */}
        <section id="how" className={cn(section, "scroll-mt-20 pb-24 lg:pb-40")} aria-labelledby="how-heading">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 id="how-heading" className="mt-2 text-title font-medium">
              Three things
            </h2>
          </Reveal>
          <ul className="mt-12 flex flex-col">
            {landing.pillars.map((p, i) => (
              <Reveal as="li" key={p.title} className={cn("grid items-center gap-8 border-t border-divider py-10 lg:grid-cols-2 lg:gap-16 lg:py-14", i === landing.pillars.length - 1 && "border-b")}>
                <div className="order-2 flex items-center justify-center rounded-card bg-sheet p-6 lg:order-1 lg:p-8">{previews[p.preview]}</div>
                <div className="order-1 lg:order-2">
                  <h3 className="text-heading font-medium">{p.title}</h3>
                  <p className="mt-3 max-w-md text-body leading-[1.55] text-text-2">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* The part that earns. */}
        <section id="recall" className={cn(section, "scroll-mt-20 pb-24 lg:pb-40")} aria-labelledby="recall-heading">
          <Reveal className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 id="recall-heading" className="text-title font-medium text-balance">
                {landing.recall.title}
              </h2>
              <p className="mt-4 max-w-md text-body leading-[1.55] text-text-2">{landing.recall.body}</p>
            </div>
            <MessageCard />
          </Reveal>
        </section>

        {/* Why it fits here. */}
        <section className={cn(section, "pb-24 lg:pb-40")} aria-labelledby="local">
          <Reveal className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 id="local" className="text-title font-medium text-balance">
                {landing.local.title}
              </h2>
              <ul className="mt-6 flex flex-col gap-4">
                {landing.local.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-body leading-[1.55] text-text-2">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-text" aria-hidden />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <Photo src="/marketing/puspin-counter.webp" alt="A puspin sitting on a clinic counter beside a window" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] rounded-sheet" />
          </Reveal>
        </section>

        {/* What it costs, and the way to ask. */}
        <section id="pricing" className={cn(section, "scroll-mt-20 pb-24 lg:pb-40")} aria-labelledby="pricing-heading">
          <Reveal className="overflow-hidden rounded-sheet bg-sheet">
            <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <h2 id="pricing-heading" className="text-title font-medium">
                  {landing.pricing.title}
                </h2>
                <p className="mt-4 text-body leading-[1.55] text-text-2">{landing.pricing.body}</p>
                <p className="mt-6 text-small text-text-2">
                  You do not need to talk to anyone to start.{" "}
                  <Link href="/sign-up" className="font-medium text-text hover:underline">
                    Create your clinic
                  </Link>{" "}
                  and use it today.
                </p>
              </div>
              <PilotForm />
            </div>
          </Reveal>
        </section>

        {/* What they are still wondering. */}
        <section id="faq" className={cn(section, "scroll-mt-20 pb-24 lg:pb-40")} aria-labelledby="faq-heading">
          <Reveal className="mx-auto max-w-3xl">
            <h2 id="faq-heading" className="text-title font-medium">
              Questions clinics ask
            </h2>
            {/* Native disclosure. It opens without JavaScript, it is keyboard
                reachable for free, and screen readers already know it. */}
            <div className="mt-8 border-t border-divider">
              {landing.faq.map((f, i) => (
                <details key={f.q} className="group border-b border-divider" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-body font-medium marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="size-5 shrink-0 text-text-2 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" strokeWidth={1.5} aria-hidden />
                  </summary>
                  <p className="max-w-2xl pb-5 text-small leading-[1.6] text-text-2">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        {/* The way in, over the logbook this product replaces. */}
        <section className={cn(section, "pb-24 lg:pb-32")} aria-labelledby="closer">
          <Reveal className="relative overflow-hidden rounded-sheet">
            <Photo src="/marketing/reception-logbook.webp" alt="A paper appointment logbook open on a clinic counter beside a phone" sizes="(min-width: 1280px) 1152px, 100vw" className="absolute inset-0 h-full w-full" />
            <div className="relative bg-text/65 px-6 py-16 text-center md:px-10 md:py-24">
              <h2 id="closer" className="text-title font-medium text-balance text-white">
                {landing.closer.title}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-body text-white/80">{landing.closer.body}</p>
              <div className="mt-8 flex justify-center">
                <Pill asChild className="bg-page text-text hover:bg-sheet">
                  <Link href="/sign-up">
                    Get started <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                </Pill>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
