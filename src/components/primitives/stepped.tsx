"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { steppedFlow } from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";

// The stepped flow, the shape twice in this product: a pet owner booking a
// visit, and an owner setting a clinic up. Both are a sequence somebody has to
// finish, so both get the same frame rather than two that drift apart.
//
// Three grounds, one inside the next. The window is the page tone, the shell
// holding the rail and the panel is the sheet tone a step in from it, and the
// panel comes back to the page tone, so it reads as cut out of the shell with
// a hairline round it and an even edge on every side. No shadows: the tones do
// the separating, as everywhere else.
//
// One panel, two shapes. On a laptop the steps stand in a rail down the left
// with their state on them, and the content sits beside it. On a phone the
// rail lies down as segments across the top and there is no panel at all: the
// step sits on the window, which is why controls inside it take the "shell"
// tone. Either way the buttons are under the content, not stuck to the bottom
// of the window, and a step already passed can be returned to by clicking it.
//
// The panel's height is fixed, so a long step scrolls inside it and the shell
// never grows or shrinks between steps. Content starts at the top, never
// centred, so nothing jumps as the steps change.

export type StepDef = { name: string; lead: string };

export function SteppedShell({
  steps,
  step,
  onStep,
  reachable,
  head,
  railFooter,
  onBack,
  backLabel,
  actions,
  stepsLabel = "Steps",
  children,
}: {
  steps: StepDef[];
  step: number;
  /** Called when a step in the rail is clicked. Only ever a reachable one. */
  onStep: (index: number) => void;
  /** Whether the person may jump to that step from where they are now. */
  reachable: (index: number) => boolean;
  /** The top of the rail. The clinic on the booking page, the product here. */
  head: ReactNode;
  railFooter?: ReactNode;
  onBack: () => void;
  backLabel: string;
  /** The button row under the content. It does not scroll with the step. */
  actions: ReactNode;
  stepsLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-h-dvh lg:flex lg:items-center lg:justify-center lg:p-6", steppedFlow.window)}>
      <div className={cn("min-h-dvh w-full p-2 lg:min-h-0 lg:max-w-booking lg:rounded-sheet", steppedFlow.frame)}>
        <div className="lg:flex lg:h-panel">
          <aside className="hidden w-rail shrink-0 flex-col p-8 lg:flex print:hidden">
            {head}
            <ol className="mt-9 flex flex-col gap-6">
              {steps.map((s, i) => {
                const done = i < step;
                const current = i === step;
                const can = reachable(i) && i !== step;
                return (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => can && onStep(i)}
                      disabled={!can}
                      aria-current={current ? "step" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-input text-left transition-opacity duration-150 motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-page",
                        can && "hover:opacity-70",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-medium",
                          done ? "bg-action text-on-action" : current ? "text-text ring-1 ring-text" : "text-text-3 ring-1 ring-divider",
                        )}
                      >
                        {done ? <Check className="size-3.5" strokeWidth={2} /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-small font-medium leading-tight", current || done ? "text-text" : "text-text-2")}>{s.name}</span>
                        <span className="mt-1 block text-label leading-tight text-text-2">{s.lead}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {railFooter ? <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-8">{railFooter}</div> : null}
          </aside>

          <main className={cn("flex justify-center px-3 py-6 lg:flex-1 lg:overflow-hidden lg:rounded-card lg:px-4 lg:py-10", steppedFlow.panel)}>
            <div className="flex w-full max-w-step flex-col gap-8 lg:h-full lg:min-h-0">
              {/* Everything above the buttons scrolls; the buttons do not, so
                  a long step never hides the way forward. */}
              <div className="flex flex-col gap-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1">
                <div className="flex flex-col gap-4 lg:hidden">
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label={backLabel}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <ArrowLeft className="size-[18px]" strokeWidth={2} />
                  </button>
                  <ol className="flex gap-2" aria-label={stepsLabel}>
                    {steps.map((s, i) => {
                      const can = reachable(i) && i !== step;
                      return (
                        <li key={s.name} className="flex-1">
                          <button
                            type="button"
                            onClick={() => can && onStep(i)}
                            disabled={!can}
                            aria-current={i === step ? "step" : undefined}
                            aria-label={`Step ${i + 1}, ${s.name}${i < step ? ", done" : i === step ? ", current" : ", not yet"}`}
                            className={cn(
                              "h-0.5 w-full rounded-full transition-colors duration-150 motion-reduce:transition-none",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-page",
                              i <= step ? "bg-action" : "bg-divider",
                            )}
                          />
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="flex flex-col gap-8">{children}</div>
              </div>

              {/* Both buttons together at the left, back first and the way
                  forward beside it, so the pair reads in the order it is used
                  and neither drifts to the far edge of the panel. */}
              <div className="flex flex-wrap items-center gap-3 lg:px-1">{actions}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** The heading and its one line, the same shape on every step. */
export function StepTitle({ heading, lead }: { heading: string; lead?: ReactNode }) {
  return (
    <div>
      <h1 className="text-title font-medium text-balance">{heading}</h1>
      {lead ? <p className="mt-1.5 text-small text-text-2">{lead}</p> : null}
    </div>
  );
}
