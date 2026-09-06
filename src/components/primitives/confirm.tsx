"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "./pill";

// Anything that removes something asks first, in the same words and the same
// shape everywhere. One dialog for the whole product, awaited like a question:
//
//   if (!(await confirm({ title: "Remove Ryan?", ... }))) return;
//
// The description says what actually happens, not "this cannot be undone",
// because most of these can be undone and the ones that cannot say so.

export interface ConfirmOptions {
  title: string;
  description?: string;
  /** The button that does the thing. Name the act: Remove, Delete, Cancel it. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button red. Use it when something is lost. */
  tone?: "danger" | "neutral";
}

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask>(async () => true);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const settle = useRef<((ok: boolean) => void) | null>(null);

  const finish = useCallback((ok: boolean) => {
    settle.current?.(ok);
    settle.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback<Ask>((next) => {
    // A second question while one is open answers the first with no.
    settle.current?.(false);
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      settle.current = resolve;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : finish(false))}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] rounded-sheet border-0 bg-sheet p-6 shadow-lifted sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-heading font-medium">{options?.title ?? ""}</DialogTitle>
            {options?.description ? <DialogDescription className="mt-1 text-small text-text-2">{options.description}</DialogDescription> : null}
          </DialogHeader>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Pill size="sm" variant="secondary" onClick={() => finish(false)}>
              {options?.cancelLabel ?? "Keep it"}
            </Pill>
            <Pill size="sm" variant={options?.tone === "neutral" ? "primary" : "danger"} onClick={() => finish(true)}>
              {options?.confirmLabel ?? "Remove"}
            </Pill>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/** Ask before removing. Resolves true when the person says yes. */
export function useConfirm() {
  return useContext(ConfirmContext);
}
