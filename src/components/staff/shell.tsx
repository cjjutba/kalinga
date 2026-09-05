"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, ClipboardList, Menu, PawPrint, Settings, Users, X, Check, Plus } from "lucide-react";
import { Lockup } from "@/components/primitives/lockup";
import { Mark } from "@/components/primitives/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SandboxBar } from "@/components/sandbox/sandbox-bar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrg } from "@/lib/mock/store";
import { can, roleLabel, type Permission } from "@/lib/roles";
import { initials } from "@/lib/mock/selectors";
import { cn } from "@/lib/utils";

// The staff shell. Laptop first: a 240 px sidebar and a top bar. On a phone
// the sidebar becomes a menu. Navigation shows only what the role can reach,
// and every page still checks on its own, because hiding a button is not a
// permission. Density over decoration: no photographs in here.

const nav: { label: string; segment: string; icon: typeof CalendarDays; permission: Permission }[] = [
  { label: "Today", segment: "", icon: CalendarDays, permission: "day_view" },
  { label: "Clients", segment: "clients", icon: Users, permission: "view_clients" },
  { label: "Pets", segment: "pets", icon: PawPrint, permission: "view_clients" },
  { label: "Recall", segment: "recall", icon: Bell, permission: "view_recall" },
  { label: "Settings", segment: "settings", icon: Settings, permission: "view_settings" },
  { label: "Audit", segment: "audit", icon: ClipboardList, permission: "view_audit" },
];

export function StaffShell({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  const { org, role, state, dispatch, members, actorMemberId } = useOrg(orgSlug);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const actor = members.find((m) => m.id === actorMemberId) ?? members[0];

  // Keep the store pointed at the clinic in the URL, so mutations land in the
  // right tenant when someone arrives by link rather than through the switcher.
  useEffect(() => {
    if (state.orgId !== org.id) dispatch({ type: "org/set", orgId: org.id });
  }, [org.id, state.orgId, dispatch]);

  const base = `/app/${org.slug}`;
  const visible = nav.filter((n) => can(role, n.permission));
  const isActive = (segment: string) => (segment === "" ? pathname === base : pathname.startsWith(`${base}/${segment}`));

  const switcher = (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5 text-left hover:bg-pill-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
        <span className="truncate text-body font-medium">{org.name}</span>
        <ChevronDown className="size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 rounded-guide border-0 bg-sheet p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
        {state.organisations.map((o) => {
          const m = state.members.find((x) => x.organisationId === o.id && x.email === actor?.email) ?? state.members.find((x) => x.organisationId === o.id);
          return (
            <DropdownMenuItem
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-tag px-3 py-2.5 text-body"
              onSelect={() => {
                dispatch({ type: "org/set", orgId: o.id });
                router.push(`/app/${o.slug}`);
              }}
            >
              <span className="min-w-0">
                <span className="block truncate">{o.name}</span>
                <span className="block text-label text-text-2">{m ? roleLabel[m.role] : "Member"}, {o.city}</span>
              </span>
              {o.id === org.id ? <Check className="size-4" strokeWidth={1.5} aria-label="Current" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1.5 bg-divider" />
        <DropdownMenuItem asChild className="rounded-tag px-3 py-2.5 text-body">
          <Link href="/new" className="flex items-center gap-2">
            <Plus className="size-4" strokeWidth={1.5} aria-hidden /> Create another clinic
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const navList = (onNavigate?: () => void) => (
    <ul className="flex flex-col gap-1">
      {visible.map((n) => {
        const href = n.segment ? `${base}/${n.segment}` : base;
        const active = isActive(n.segment);
        return (
          <li key={n.label}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-input px-3 py-2.5 text-body transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                active ? "bg-sheet font-medium text-text" : "text-text-2 hover:bg-sheet/60 hover:text-text",
              )}
            >
              <n.icon className="size-5" strokeWidth={1.5} aria-hidden />
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-dvh bg-page">
      <SandboxBar orgSlug={org.slug} />
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 px-4 py-6 lg:flex">
          <div className="px-3">
            <Lockup href={base} size="sm" />
          </div>
          <div className="px-1">{switcher}</div>
          <nav aria-label="Main">{navList()}</nav>
          <div className="mt-auto flex flex-col gap-3 px-1">
            <ThemeToggle compact />
            <div className="flex items-center gap-3 px-2">
              <span className="grid size-9 place-items-center rounded-full bg-pill-2 text-label font-medium">{actor ? initials(actor.name) : "?"}</span>
              <span className="min-w-0">
                <span className="block truncate text-small font-medium">{actor?.name ?? "Signed in"}</span>
                <span className="block text-label text-text-2">{roleLabel[role]}</span>
              </span>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-page/95 px-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="staff-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-full hover:bg-pill-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {menuOpen ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
            </button>
            <Link href={base} aria-label="Today" className="grid size-9 place-items-center rounded-full text-text">
              <Mark className="h-5 w-auto" />
            </Link>
            <div className="min-w-0 flex-1">{switcher}</div>
            <ThemeToggle compact className="hidden sm:inline-flex" />
          </header>
          {menuOpen ? (
            <nav id="staff-menu" aria-label="Main" className="border-b border-divider bg-page px-3 pb-4 lg:hidden">
              {navList(() => setMenuOpen(false))}
              <div className="mt-3 flex items-center justify-between px-3">
                <span className="text-small text-text-2">
                  {actor?.name}, {roleLabel[role]}
                </span>
                <ThemeToggle compact />
              </div>
            </nav>
          ) : null}
          <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
