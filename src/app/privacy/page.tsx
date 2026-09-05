import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/primitives/lockup";
import { Pill } from "@/components/primitives/pill";
import { SiteFooter } from "@/components/marketing/site-footer";
import { privacy } from "@/content/privacy";

export const metadata: Metadata = { title: "Privacy", description: "What Kalinga collects, why, how long it is kept, and how to have it deleted." };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <Lockup href="/" />
        <Pill asChild size="sm" variant="secondary">
          <Link href="/privacy/request">Delete my data</Link>
        </Pill>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-6">
        <h1 className="text-title font-medium">Privacy</h1>
        <p className="mt-1 text-label text-text-2">Updated {privacy.updated}</p>
        <p className="mt-6 text-body text-text-2">{privacy.intro}</p>
        <div className="mt-10 flex flex-col gap-8">
          {privacy.sections.map((s) => (
            <section key={s.title} aria-labelledby={s.title.replace(/\s+/g, "-").toLowerCase()}>
              <h2 id={s.title.replace(/\s+/g, "-").toLowerCase()} className="text-heading font-medium">
                {s.title}
              </h2>
              <p className="mt-2 text-body text-text-2">{s.body}</p>
            </section>
          ))}
          <section className="rounded-card bg-sheet p-6" aria-labelledby="contact">
            <h2 id="contact" className="text-heading font-medium">
              Asking for your data, or for it to go
            </h2>
            <p className="mt-2 text-body text-text-2">{privacy.contact.lead}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Pill asChild size="sm">
                <Link href="/privacy/request">Make a request</Link>
              </Pill>
              <Pill asChild size="sm" variant="secondary">
                <a href={`mailto:${privacy.contact.email}`}>{privacy.contact.email}</a>
              </Pill>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
