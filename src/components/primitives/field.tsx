"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, Eye, EyeOff } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// A field owns its label, control, helper line and error together, so no
// screen can ship an input without a label. DESIGN.md: an input is always one
// step of tone away from what it sits on. On a sheet it is --field, on the
// page it is --sheet. Never a border. Errors are a red ring and one red line.

// "auto" is for auth forms, which sit on a sheet below the laptop breakpoint
// and directly on the page above it.
type Surface = "sheet" | "page" | "auto";

const surfaceFill: Record<Surface, string> = {
  sheet: "bg-field",
  page: "bg-sheet",
  auto: "bg-field lg:bg-sheet",
};

interface FieldFrameProps {
  label: string;
  helper?: ReactNode;
  error?: string;
  /** What the field sits on. Defaults to a sheet. */
  on?: Surface;
  /** Text shown after the label, e.g. "Optional". */
  hint?: string;
  /** A control on the label row, right aligned. A link, never a second input. */
  labelAction?: ReactNode;
  className?: string;
  id: string;
  children: ReactNode;
}

function FieldFrame({ label, helper, error, hint, labelAction, className, id, children }: FieldFrameProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label id={`${id}-label`} htmlFor={id} className="text-[13px] font-medium text-text">
          {label}
        </label>
        {labelAction ?? (hint ? <span className="text-[13px] text-text-2">{hint}</span> : null)}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-error">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-[13px] text-text-2">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export const controlClass = (on: Surface, error?: boolean, extra?: string) =>
  cn(
    "w-full rounded-input px-4 text-[17px] text-text placeholder:text-text-3",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
    surfaceFill[on],
    error ? "ring-2 ring-error focus-visible:ring-error" : "focus-visible:ring-focus",
    "disabled:opacity-60",
    extra,
  );

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  helper?: ReactNode;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  on?: Surface;
  /** A fixed prefix inside the control, e.g. a URL stem. */
  prefix?: string;
  wrapperClassName?: string;
  id?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, helper, error, hint, labelAction, on = "sheet", prefix, className, wrapperClassName, id: givenId, type, ...props },
  ref,
) {
  const auto = useId();
  const id = givenId ?? auto;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;

  const input = (
    <input
      ref={ref}
      id={id}
      type={isPassword ? (reveal ? "text" : "password") : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={cn(controlClass(on, !!error, "h-12"), prefix && "rounded-l-none pl-0", isPassword && "pr-12", className)}
      {...props}
    />
  );

  return (
    <FieldFrame label={label} helper={helper} error={error} hint={hint} labelAction={labelAction} on={on} id={id} className={wrapperClassName}>
      {prefix || isPassword ? (
        <div className={cn("relative flex items-stretch rounded-input", error && "ring-2 ring-error", surfaceFill[on])}>
          {prefix ? (
            <span className="flex items-center pl-4 pr-1 text-[17px] text-text-2 select-none" aria-hidden>
              {prefix}
            </span>
          ) : null}
          <input
            ref={ref}
            id={id}
            type={isPassword ? (reveal ? "text" : "password") : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-12 w-full min-w-0 bg-transparent text-[17px] text-text placeholder:text-text-3 focus:outline-none rounded-input",
              "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sheet",
              prefix ? "pl-0 pr-4" : "px-4",
              isPassword && "pr-12",
              className,
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              aria-pressed={reveal}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-input text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {reveal ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
            </button>
          ) : null}
        </div>
      ) : (
        input
      )}
    </FieldFrame>
  );
});

export interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  helper?: ReactNode;
  error?: string;
  hint?: string;
  on?: Surface;
  wrapperClassName?: string;
  id?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, helper, error, hint, on = "sheet", className, wrapperClassName, id: givenId, rows = 4, ...props },
  ref,
) {
  const auto = useId();
  const id = givenId ?? auto;
  return (
    <FieldFrame label={label} helper={helper} error={error} hint={hint} on={on} id={id} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        className={cn(controlClass(on, !!error, "py-3 leading-[1.4] resize-y"), className)}
        {...props}
      />
    </FieldFrame>
  );
});

export interface SelectFieldProps {
  label: string;
  helper?: ReactNode;
  error?: string;
  hint?: string;
  on?: Surface;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  /** Shown when nothing is chosen yet. */
  placeholder?: string;
}

const EMPTY = "__none__";

// One dropdown for the whole product. The native control cannot be styled to
// the design system and looks like the operating system rather than Kalinga,
// so this is the Radix listbox: same tone, same corners and same focus ring as
// an input, a check against the current choice, keyboard and screen reader
// behaviour handled by the primitive. The label points at the trigger, which
// is a button and so takes a label like any other control.
export function SelectField({ label, helper, error, hint, on = "sheet", id: givenId, value, onChange, options, className, disabled, placeholder }: SelectFieldProps) {
  const auto = useId();
  const id = givenId ?? auto;
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  // The primitive refuses an empty value, because empty means "nothing chosen"
  // to it. Several fields here have a real option that means none, so it
  // travels under a sentinel and comes back out empty.
  const encode = (v: string) => (v === "" ? EMPTY : v);
  return (
    <FieldFrame label={label} helper={helper} error={error} hint={hint} on={on} id={id} className={className}>
      <SelectPrimitive.Root value={encode(value)} onValueChange={(v) => onChange(v === EMPTY ? "" : v)} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={id}
          aria-labelledby={`${id}-label ${id}`}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlClass(on, !!error, "flex h-12 min-w-0 items-center justify-between gap-2 pr-3 text-left"),
            "data-[placeholder]:text-text-3",
          )}
        >
          <span className="min-w-0 truncate">
            <SelectPrimitive.Value placeholder={placeholder ?? "Choose one"} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-40 overflow-hidden",
              "rounded-input bg-sheet p-1.5 text-text ring-1 ring-divider shadow-[0_12px_32px_rgba(0,0,0,0.14)]",
              "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none",
            )}
          >
            <SelectPrimitive.Viewport className="max-h-[inherit] overflow-y-auto">
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={encode(o.value)}
                  className={cn(
                    "relative flex cursor-default select-none items-center justify-between gap-3 rounded-tag py-2.5 pl-3 pr-2.5 text-[15px] outline-none",
                    "data-highlighted:bg-field data-[state=checked]:font-medium",
                  )}
                >
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FieldFrame>
  );
}

export { FieldFrame };
