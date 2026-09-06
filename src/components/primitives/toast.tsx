"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// What the product says back when something happened away from the eye: a
// booking moved, a save failed, an invitation went out. Bottom right, one line
// of what happened and one of why, and it takes itself away. There is no close
// button, because a message that needs dismissing is a message that should
// have been on the page.

type ToastKind = "success" | "error" | "info";

interface ToastInput {
  kind?: ToastKind;
  title: string;
  detail?: string;
}

interface ToastItem extends ToastInput {
  id: number;
  kind: ToastKind;
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

// An error stays longer, because it is read twice: once to see it failed and
// once to read why.
const life: Record<ToastKind, number> = { success: 3500, info: 4000, error: 6500 };

const tone: Record<ToastKind, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "text-text" },
  error: { icon: AlertCircle, className: "text-error" },
  info: { icon: Info, className: "text-text-2" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);
  const timers = useRef(new Map<number, number>());

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) window.clearTimeout(handle);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = (next.current += 1);
      const kind = input.kind ?? "success";
      // Four at a time. Past that the oldest has been read or was never read.
      setItems((list) => [...list, { ...input, kind, id }].slice(-4));
      timers.current.set(id, window.setTimeout(() => remove(id), life[kind]));
    },
    [remove],
  );

  useEffect(() => {
    const handles = timers.current;
    return () => {
      handles.forEach((h) => window.clearTimeout(h));
      handles.clear();
    };
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(21rem,calc(100vw-2rem))] flex-col gap-2 print:hidden">
        {items.map((t) => {
          const { icon: Icon, className } = tone[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex gap-2.5 rounded-guide bg-sheet p-3.5 ring-1 ring-divider shadow-lifted",
                "animate-in fade-in-0 slide-in-from-bottom-2 duration-150 motion-reduce:animate-none",
              )}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", className)} strokeWidth={1.5} aria-hidden />
              <div className="min-w-0">
                <p className="text-small font-medium">{t.title}</p>
                {t.detail ? <p className="mt-0.5 text-label leading-[1.4] text-text-2">{t.detail}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Say something happened. Defaults to success, because most things work. */
export function useToast() {
  return useContext(ToastContext);
}
