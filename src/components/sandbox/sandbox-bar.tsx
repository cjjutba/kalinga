"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/mock/store";
import { allRoles, roleLabel, type Role } from "@/lib/roles";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

// On every staff page in the demo. A role switcher across all four roles, the
// time remaining, and the reminder that nothing is sent. In the prototype it
// doubles as the way to see the application as each role, since there is no
// real sign in yet.

function remaining(startedAt: string): string {
  const end = new Date(startedAt).getTime() + 24 * 60 * 60 * 1000;
  const ms = Math.max(0, end - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} h ${m} min left` : `${m} min left`;
}

export function SandboxBar({ orgSlug }: { orgSlug: string }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const mounted = useMounted();

  function pick(role: Role) {
    dispatch({ type: "role/set", role });
    if (role === "pet_owner") router.push("/me/appointments");
    else router.push(`/app/${orgSlug}`);
  }

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 bg-text px-3 py-2 text-on-action lg:static" role="region" aria-label="Sandbox">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-on-action/15 px-2 py-0.5 text-label font-medium">Sandbox</span>
        <span className="hidden text-label text-on-action/70 sm:inline">This demo sends nothing. {mounted ? remaining(state.sandboxStartedAt) : ""}</span>
      </div>
      <div role="radiogroup" aria-label="View as" className="flex items-center gap-1 sm:ml-auto">
        <span className="mr-1 hidden text-label text-on-action/70 md:inline">View as</span>
        {allRoles.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={state.role === r}
            onClick={() => pick(r)}
            className={cn(
              "h-7 rounded-full px-2.5 text-label font-medium transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-action focus-visible:ring-offset-2 focus-visible:ring-offset-text",
              state.role === r ? "bg-on-action text-text" : "text-on-action/80 hover:bg-on-action/15",
            )}
          >
            {roleLabel[r]}
          </button>
        ))}
      </div>
    </div>
  );
}
