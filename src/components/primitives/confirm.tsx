"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "./pill";

// Anything that removes something asks first, in the same words and the same
// shape everywhere.
//
// The work runs inside the dialog. The button that starts it spins, nothing
// else can be pressed, and the dialog closes only once the work is done, so
// the answer to "did that happen" is always in the same place as the question.
// That is why `run` is required: a confirmation that only returns a yes leaves
// the caller to spin somewhere else, which is what this replaces.

export interface ConfirmOptions {
  title: string;
  description?: string;
  /** The button that does the thing. Name the act: Remove, Delete, Cancel it. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shown beside the spinner while the work runs. */
  busyLabel?: string;
  /** "danger" paints the confirm button red. Use it when something is lost. */
  tone?: "danger" | "neutral";
  /**
   * The work itself. Return false to keep the dialog open, for a refusal the
   * person can do something about: the reason will be in a toast over it.
   */
  run: () => Promise<boolean | void>;
}

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask>(async () => true);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const settle = useRef<((ok: boolean) => void) | null>(null);

  const close = useCallback((ok: boolean) => {
    settle.current?.(ok);
    settle.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback<Ask>((next) => {
    // A second question while one is open answers the first with no.
    settle.current?.(false);
    setOptions(next);
    setBusy(false);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      settle.current = resolve;
    });
  }, []);

  async function act() {
    if (!options || busy) return;
    setBusy(true);
    let done = true;
    try {
      done = (await options.run()) !== false;
    } catch {
      done = false;
    }
    setBusy(false);
    if (done) close(true);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) return setOpen(true);
          // Nothing closes it while the work is in flight, including Escape
          // and a click outside.
          if (!busy) close(false);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] rounded-sheet border-0 bg-sheet p-6 shadow-lifted sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">{options?.title ?? ""}</DialogTitle>
            {options?.description ? <DialogDescription className="mt-1 text-small text-text-2">{options.description}</DialogDescription> : null}
          </DialogHeader>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Pill size="sm" variant="secondary" onClick={() => close(false)} disabled={busy}>
              {options?.cancelLabel ?? "Keep it"}
            </Pill>
            <Pill
              size="sm"
              variant={options?.tone === "neutral" ? "primary" : "danger"}
              loading={busy}
              loadingLabel={options?.busyLabel ?? "Working"}
              onClick={act}
            >
              {options?.confirmLabel ?? "Remove"}
            </Pill>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/** Ask before removing, and let the dialog carry the work. */
export function useConfirm() {
  return useContext(ConfirmContext);
}
