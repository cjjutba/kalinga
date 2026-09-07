import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Lockup } from "@/components/primitives/lockup";
import { Photo } from "@/components/primitives/photo";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { StatusPill } from "@/components/primitives/status-pill";
import { landing } from "@/content/landing";
import { renderReminder } from "@/content/templates";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Kalinga, booking and recall for vet clinics",
  description: landing.hero.lead,
};

// The landing page. Photography carries the warmth, the interface stays
// quiet, and the positioning is Northern Mindanao rather than generic.

export default function Home() {
  const sample = renderReminder("vaccination", { petName: "Kiko", ownerName: "Maria", clinicName: "Lunhaw Animal Clinic", dueOn: "2026-10-02", bookingUrl: "kalinga.cjjutba.dev/lunhaw" });
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Lockup href="/" />
        <nav aria-label="Site" className="flex items-center gap-2">
          <Link href="/sign-in" className="hidden h-10 items-center rounded-full px-4 text-small font-medium text-text hover:bg-sheet sm:inline-flex">
            Sign in
          </Link>
          <Pill asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Pill>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-16 pt-8 md:grid-cols-2 md:items-center md:px-8 md:pt-16">
          <div>
            <h1 className="text-[34px] font-medium leading-[1.1] tracking-[-0.01em] text-balance md:text-[44px]">{landing.hero.title}</h1>
            <p className="mt-5 max-w-lg text-body text-text-2">{landing.hero.lead}</p>
            <div className="mt-8">
              <Pill asChild>
                <Link href={landing.hero.primary.href}>
                  {landing.hero.primary.label} <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                </Link>
              </Pill>
            </div>
          </div>
          <div className="relative">
            <Photo className="aspect-[4/5] rounded-sheet md:aspect-[5/6]" caption="Photograph, an aspin portrait" />
            <Card tone="tint" className="absolute -bottom-6 left-4 right-4 rotate-[-2deg] p-4 shadow-lifted sm:left-auto sm:w-72" aria-hidden>
              <p className="text-label font-medium text-text-2">Next appointment</p>
              <p className="mt-1 text-body">Kiko, 9:30 AM, Vaccination</p>
              <StatusPill status="confirmed" className="mt-2 bg-sheet" />
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8" aria-labelledby="problem">
          <div className="max-w-2xl">
            <h2 id="problem" className="text-title font-medium text-balance">
              {landing.problem.title}
            </h2>
            <p className="mt-4 text-body text-text-2">{landing.problem.body}</p>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {landing.pillars.map((p) => (
              <li key={p.title}>
                <Card className="h-full p-6">
                  <h3 className="text-heading font-medium">{p.title}</h3>
                  <p className="mt-2 text-small text-text-2">{p.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 md:grid-cols-2 md:items-center md:px-8" aria-labelledby="recall">
          <div>
            <h2 id="recall" className="text-title font-medium text-balance">
              Recall is the reason anyone pays
            </h2>
            <p className="mt-4 text-body text-text-2">Vaccinations are yearly. Deworming is every three months. Grooming is every four to six weeks. Kalinga counts from the last visit and writes the message. The desk sends it the way it already talks to that client.</p>
          </div>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-body font-medium">
                  Kiko<span className="font-normal text-text-2">, Aspin</span>
                </p>
                <p className="text-small text-text-2">Maria Kristina Angelica de los Santos Villanueva, 0917 555 0101</p>
              </div>
              <StatusPill status="due" size="sm" />
            </div>
            <blockquote className="mt-3 rounded-guide bg-field p-3.5 text-small leading-[1.5]">{sample}</blockquote>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex h-8 items-center rounded-full bg-pill-2 px-3 text-label font-medium">Copy message</span>
              <span className="inline-flex h-8 items-center rounded-full bg-action px-3 text-label font-medium text-on-action">Mark sent</span>
            </div>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8" aria-labelledby="local">
          <div className="grid gap-8 md:grid-cols-2 md:items-start">
            <div>
              <h2 id="local" className="text-title font-medium text-balance">
                {landing.local.title}
              </h2>
              <ul className="mt-6 flex flex-col gap-3">
                {landing.local.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-body text-text-2">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-text" aria-hidden />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <Photo className="aspect-[4/3] rounded-sheet" caption="Photograph, a puspin portrait" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8" aria-labelledby="pricing">
          <Card className="grid gap-6 p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-10">
            <div>
              <h2 id="pricing" className="text-title font-medium">
                {landing.pricing.title}
              </h2>
              <p className="mt-3 max-w-2xl text-body text-text-2">{landing.pricing.body}</p>
            </div>
            <Pill asChild>
              <a href={landing.pricing.cta.href}>
                {landing.pricing.cta.label} <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
              </a>
            </Pill>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8" aria-labelledby="faq">
          <h2 id="faq" className="text-title font-medium">
            Questions clinics ask
          </h2>
          <dl className="mt-6 divide-y divide-divider">
            {landing.faq.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-body font-medium">{f.q}</dt>
                <dd className="mt-1.5 text-small text-text-2">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
