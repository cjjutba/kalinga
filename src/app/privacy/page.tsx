import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { SiteFooter } from "@/components/marketing/site-footer";
import { privacy } from "@/content/privacy";

export const metadata: Metadata = { title: "Privacy", description: "What Kalinga collects, why, how long it is kept, and how to have it deleted." };

const anchor = (title: string) => title.replace(/\s+/g, "-").toLowerCase();

// A privacy notice people actually read, which means it is laid out like a
// document and not like a wall. The sections are numbered and listed at the
// top, so somebody looking for one answer can jump to it, and every heading is
// an anchor they can send to somebody else.

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-30 border-b border-divider bg-page/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 md:px-8">
          <Lockup href="/" size="sm" />
          <Pill asChild size="sm" variant="secondary">
            <Link href="/privacy/request">Delete my data</Link>
          </Pill>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12 md:px-8 md:pt-16">
        <div className="max-w-2xl">
          <p className="text-label font-medium uppercase tracking-[0.08em] text-text-2">Privacy notice</p>
          <h1 className="mt-2 text-[32px] font-medium leading-[1.15] tracking-[-0.015em] text-balance md:text-[40px]">What we hold, and how to have it gone</h1>
          <p className="mt-5 text-body leading-[1.6] text-text-2">{privacy.intro}</p>
          <p className="mt-4 text-label text-text-2">Updated {privacy.updated}</p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          {/* On a laptop the contents follow you down the page. On a phone they
              sit above the notice, where a list of eight links is still the
              fastest way to the one paragraph somebody came for. */}
          <nav aria-label="Contents" className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-label font-medium text-text-2">Contents</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {privacy.sections.map((s, i) => (
                <li key={s.title}>
                  <a
                    href={`#${anchor(s.title)}`}
                    className="flex gap-2.5 rounded-tag text-small text-text-2 transition-colors duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
                  >
                    <span className="tabular text-text-3">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0">
            <div className="border-t border-divider">
              {privacy.sections.map((s, i) => (
                <section key={s.title} id={anchor(s.title)} className="scroll-mt-24 border-b border-divider py-8" aria-labelledby={`${anchor(s.title)}-heading`}>
                  <p className="text-label tabular text-text-3">{String(i + 1).padStart(2, "0")}</p>
                  <h2 id={`${anchor(s.title)}-heading`} className="mt-1 text-heading font-medium">
                    {s.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-body leading-[1.6] text-text-2">{s.body}</p>
                </section>
              ))}
            </div>

            <section className="mt-10 rounded-sheet bg-sheet p-6 md:p-8" aria-labelledby="contact">
              <h2 id="contact" className="text-heading font-medium">
                Asking for your data, or for it to go
              </h2>
              <p className="mt-2 max-w-2xl text-body leading-[1.6] text-text-2">{privacy.contact.lead}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Pill asChild size="sm">
                  <Link href="/privacy/request">
                    Make a request <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                </Pill>
                <Pill asChild size="sm" variant="secondary">
                  <a href={`mailto:${privacy.contact.email}`}>{privacy.contact.email}</a>
                </Pill>
              </div>
              <p className="mt-4 text-label text-text-2">We answer within fifteen days, which is what the Data Privacy Act asks of us.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
