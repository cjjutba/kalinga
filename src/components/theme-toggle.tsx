"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

// Three way switch, light, system, dark. The stored theme is only known on the
// client, so a quiet placeholder renders until hydration and the server and
// client agree.

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <div className={cn("h-9 w-[7.5rem] rounded-full bg-pill-2", className)} aria-hidden />;

  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("inline-flex h-9 items-center gap-0.5 rounded-full bg-pill-2 p-0.5", className)}>
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
              active ? "bg-sheet text-text" : "text-text-2 hover:text-text",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} aria-hidden />
            {compact ? null : <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
