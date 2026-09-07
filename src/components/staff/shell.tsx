"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, Check, ChevronDown, ChevronsUpDown, ClipboardList, ExternalLink, LogOut, Menu, MoreHorizontal, PawPrint, Plus, Rocket, Settings, Shield, Users } from "lucide-react";
import { ThemeMenuRow } from "@/components/theme-toggle";
import { ClinicForm } from "@/components/clinic/clinic-form";
import { useToast } from "@/components/primitives/toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { settingsSections } from "@/content/settings-sections";
import { useOrg } from "@/lib/org-data";
import { authClient } from "@/lib/auth-client";
import { can, roleLabel, type Permission } from "@/lib/roles";
import { initials } from "@/lib/domain/selectors";
import { cn } from "@/lib/utils";

// The staff shell. Laptop first: a 272 px sidebar behind a hairline and a top
// bar on phones. The clinic sits at the top of the sidebar, not the product
// name, because the person working here already knows what they opened. On a
// phone the whole sidebar slides in from the left. Navigation shows only what
// the role can reach, and every page and action still checks on the server,
// because hiding a button is not a permission.

const nav: { label: string; segment: string; icon: typeof CalendarDays; permission: Permission }[] = [
  { label: "Today", segment: "", icon: CalendarDays, permission: "day_view" },
  { label: "Clients", segment: "clients", icon: Users, permission: "view_clients" },
  { label: "Pets", segment: "pets", icon: PawPrint, permission: "view_clients" },
  { label: "Recall", segment: "recall", icon: Bell, permission: "view_recall" },
  { label: "Audit", segment: "audit", icon: ClipboardList, permission: "view_audit" },
];

// Settings sits under the rest and opens into its sections, so each one is a
// page of its own rather than a tab repeated on all six.
const settingsNav = { label: "Settings", segment: "settings", icon: Settings, permission: "view_settings" as Permission };

const menuContent = "w-64 rounded-guide border-0 bg-sheet p-1.5 ring-1 ring-divider shadow-lifted";
const menuItem = "rounded-tag px-3 py-2.5 text-[15px]";

export function StaffShell({ userName, children }: { userName: string; children: ReactNode }) {
  const { org, role, memberships, pending } = useOrg();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newClinicOpen, setNewClinicOpen] = useState(false);
  // Open while you are inside settings, unless you closed it yourself.
  const [settingsToggled, setSettingsToggled] = useState<boolean | null>(null);
  const [creatingClinic, setCreatingClinic] = useState(false);

  const base = `/app/${org.slug}`;
  // Opening another clinic is an owner's act, and the server refuses it for
  // anyone else, so the way in is not offered either.
  const mayCreateClinic = memberships.some((m) => m.role === "owner");
  const visible = nav.filter((n) => can(role, n.permission));
  const isActive = (segment: string) => (segment === "" ? pathname === base : pathname.startsWith(`${base}/${segment}`));

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  const clinicSwitcher = (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-2.5 rounded-input px-2 py-2 text-left transition-colors duration-150 hover:bg-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page motion-reduce:transition-none">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-tag bg-action text-[13px] font-semibold text-on-action">
          {org.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-small font-medium">{org.name}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(menuContent, "w-72")}>
        {memberships.map((m) => (
          <DropdownMenuItem key={m.organisation.id} className={cn(menuItem, "flex items-center justify-between gap-3")} onSelect={() => {
              setMenuOpen(false);
              router.push(`/app/${m.organisation.slug}`);
            }}>
            <span className="min-w-0">
              <span className="block truncate">{m.organisation.name}</span>
              <span className="block text-label text-text-2">
                {roleLabel[m.role]}
                {m.organisation.city ? `, ${m.organisation.city}` : ""}
              </span>
            </span>
            {m.organisation.id === org.id ? <Check className="size-4 shrink-0" strokeWidth={1.5} aria-label="Current" /> : null}
          </DropdownMenuItem>
        ))}
        {mayCreateClinic ? (
          <>
            <DropdownMenuSeparator className="my-1.5 bg-divider" />
            <DropdownMenuItem
              className={cn(menuItem, "flex items-center gap-2")}
              onSelect={() => {
                setMenuOpen(false);
                setNewClinicOpen(true);
              }}
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden /> Create another clinic
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const accountMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-2.5 rounded-input px-2 py-2 text-left transition-colors duration-150 hover:bg-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page motion-reduce:transition-none">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-pill-2 text-[12px] font-medium">
          {initials(userName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-medium">{userName}</span>
          <span className="block truncate text-label text-text-2">{roleLabel[role]}</span>
        </span>
        <MoreHorizontal className="size-4 shrink-0 text-text-2" strokeWidth={1.5} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className={menuContent}>
        <ThemeMenuRow />
        <DropdownMenuSeparator className="my-1.5 bg-divider" />
        <DropdownMenuItem asChild className={menuItem}>
          <Link href={`${base}/start`} className="flex items-center gap-2">
            <Rocket className="size-4" strokeWidth={1.5} aria-hidden /> Setup guide
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <a href={`/${org.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden /> Booking page
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <Link href="/privacy" className="flex items-center gap-2">
            <Shield className="size-4" strokeWidth={1.5} aria-hidden /> Privacy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5 bg-divider" />
        <DropdownMenuItem className={cn(menuItem, "flex items-center gap-2")} onSelect={signOut}>
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const inSettings = pathname.startsWith(`${base}/settings`);
  const settingsOpen = settingsToggled ?? inSettings;
  // One row shape for the whole sidebar, so a section and a page under it are
  // the same height and sit on the same left edge.
  const itemClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-input px-2.5 py-2 text-small transition-colors duration-150 motion-reduce:transition-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page",
      active ? "bg-sheet font-medium text-text" : "text-text-2 hover:bg-sheet/70 hover:text-text",
    );

  const navList = (
    <ul className="flex flex-col gap-0.5">
      {visible.map((n) => {
        const href = n.segment ? `${base}/${n.segment}` : base;
        const active = isActive(n.segment);
        return (
          <li key={n.label}>
            <Link href={href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
              <n.icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              {n.label}
            </Link>
          </li>
        );
      })}

      {can(role, settingsNav.permission) ? (
        <li>
          {/* The section header carries the deeper tone and the page under it
              the lighter one, so the row you are on is never the same fill as
              the group it belongs to. */}
          <button
            type="button"
            onClick={() => setSettingsToggled(!settingsOpen)}
            aria-expanded={settingsOpen}
            className={cn(itemClass(false), inSettings && "bg-divider font-medium text-text hover:bg-divider")}
          >
            <settingsNav.icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            {settingsNav.label}
            <ChevronDown className={cn("ml-auto size-4 shrink-0 text-text-3 transition-transform duration-150 motion-reduce:transition-none", settingsOpen && "rotate-180")} strokeWidth={1.5} aria-hidden />
          </button>
          {settingsOpen ? (
            <ul className="mt-0.5 flex flex-col gap-0.5 pl-4">
              {settingsSections.map((sec) => {
                const href = sec.segment ? `${base}/settings/${sec.segment}` : `${base}/settings`;
                const on = sec.segment ? pathname.startsWith(href) : pathname === `${base}/settings`;
                return (
                  <li key={sec.label}>
                    <Link href={href} aria-current={on ? "page" : undefined} className={itemClass(on)}>
                      <sec.icon className={cn("size-4 shrink-0", on ? "text-text" : "text-text-3")} strokeWidth={1.5} aria-hidden />
                      {sec.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </li>
      ) : null}
    </ul>
  );

  const sidebar = (
    <>
      <div>{clinicSwitcher}</div>
      <nav aria-label="Main" className="mt-5 min-h-0 flex-1 overflow-y-auto">
        {navList}
      </nav>
      <div className="mt-4 border-t border-divider pt-2">{accountMenu}</div>
    </>
  );

  return (
    <div className="min-h-dvh bg-page">
      {pending ? <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-action/60 motion-reduce:hidden" aria-hidden /> : null}
      <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-divider px-3 py-4 lg:flex print:hidden">{sidebar}</aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-divider bg-page/95 px-2 backdrop-blur lg:hidden print:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid size-10 shrink-0 place-items-center rounded-full text-text-2 hover:bg-pill-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <Link href={base} className="flex min-w-0 items-center gap-2.5 rounded-input px-1 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-tag bg-action text-[13px] font-semibold text-on-action">
                {org.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 truncate text-small font-medium">{org.name}</span>
            </Link>
          </header>

          {/* A second clinic is made from inside the first, not on a page of
              its own. Only the address in the bar changes when it lands. */}
          <Dialog
            open={newClinicOpen}
            onOpenChange={(next) => {
              if (next) return setNewClinicOpen(true);
              if (!creatingClinic) setNewClinicOpen(false);
            }}
          >
            <DialogContent showCloseButton={!creatingClinic} className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-sheet border-0 bg-sheet p-6 shadow-lifted sm:max-w-lg sm:p-7">
              <DialogHeader className="text-left">
                <DialogTitle className="text-heading font-medium">Create another clinic</DialogTitle>
                <DialogDescription className="text-small text-text-2">You own this one too. Services, hours and staff come next, inside it.</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <ClinicForm
                  onBusyChange={setCreatingClinic}
                  onDone={(slug) => {
                    setNewClinicOpen(false);
                    if (!slug) return;
                    toast({ title: "Clinic created", detail: "You are in it now. Add a service to take a booking." });
                    router.push(`/app/${slug}`);
                    router.refresh();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent
              side="left"
              showCloseButton={false}
              aria-describedby={undefined}
              // A tap on any link in the sheet is a navigation, so the sheet gets out of the way.
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) setMenuOpen(false);
              }}
              className="flex w-[280px] flex-col gap-0 border-r border-divider bg-page px-3 py-4 text-text sm:max-w-[280px]"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>

          <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pt-8 print:max-w-none print:p-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
