"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Pill } from "@/components/primitives/pill";
import { useStore } from "@/lib/mock/store";

// A short guided tour, a handful of steps, dismissable. It is a quiet card
// pinned to the bottom, never a spotlight that hides the interface, because
// the interface is the thing being shown. Opens from ?tour=1 or the sandbox
// bar. Respects reduced motion by having no motion.

const steps = (org: string) => [
  {
    title: "This is today",
    body: "Sixteen appointments, two cancelled, one no-show, a walk-in with no service yet. The worst realistic Tuesday. Click any row to confirm, check in, move or cancel it.",
    href: `/app/${org}`,
  },
  {
    title: "Every animal has a record",
    body: "Who it is, what happened last time, and what is due next. A vet opens this mid consultation and adds today's visit, which moves the recall dates forward.",
    href: `/app/${org}/pets/first`,
  },
  {
    title: "Recall is why a clinic pays",
    body: "Everything due this week, with the message already written. Copy it, send it on Messenger or as a text, mark it sent. Nothing is transmitted from here.",
    href: `/app/${org}/recall`,
  },
  {
    title: "Switch roles at the top",
    body: "Owner sees everything. Front desk runs the day but cannot read visit notes. A vet sees their own column. Pet owner drops you into the client side. Try each.",
    href: `/app/${org}/settings/staff`,
  },
];

export function Tour({ orgSlug }: { orgSlug: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { state, dispatch } = useStore();
  const wanted = params.get("tour") === "1";
  const [step, setStep] = useState(0);
  const [closed, setClosed] = useState(false);
  // Open while the URL asks for it, until dismissed here or in the store.
  const open = wanted && !state.tourDismissed && !closed;

  if (!open) return null;
  const list = steps(orgSlug);
  const current = list[step];

  function close() {
    setClosed(true);
    dispatch({ type: "tour/dismiss" });
    router.replace(pathname);
  }
  function go(i: number) {
    const next = list[i];
    setStep(i);
    if (next && !pathname.startsWith(next.href.replace(/\/first$/, ""))) router.push(`${next.href}?tour=1`);
  }

  return (
    <div role="dialog" aria-labelledby="tour-title" aria-describedby="tour-body" className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-card bg-sheet p-5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] sm:inset-x-auto sm:right-6 sm:bottom-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-label font-medium text-text-2">
          Tour, {step + 1} of {list.length}
        </p>
        <button type="button" onClick={close} aria-label="Close the tour" className="grid size-8 place-items-center rounded-full text-text-2 hover:bg-field hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      <h2 id="tour-title" className="mt-1 text-heading font-medium">
        {current.title}
      </h2>
      <p id="tour-body" className="mt-1.5 text-small text-text-2">
        {current.body}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1" aria-hidden>
          {list.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full ${i === step ? "w-5 bg-action" : "w-1.5 bg-divider"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 ? (
            <Pill size="xs" variant="secondary" onClick={() => go(step - 1)}>
              Back
            </Pill>
          ) : null}
          {step < list.length - 1 ? (
            <Pill size="xs" onClick={() => go(step + 1)}>
              Next
            </Pill>
          ) : (
            <Pill size="xs" onClick={close}>
              Done
            </Pill>
          )}
        </div>
      </div>
    </div>
  );
}
