"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { PageHeader, NotForRole } from "./page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputField, SelectField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { Card } from "@/components/primitives/surfaces";
import { useConfirm } from "@/components/primitives/confirm";
import { useOrg } from "@/lib/org-data";
import { can, roleDescription, roleLabel, staffRoles, type Role } from "@/lib/roles";
import type { Provider, Service, WeeklyRule } from "@/lib/domain/types";
import { renderBookingChanged, renderBookingConfirmation, renderReminder, templateCatalogue } from "@/content/templates";
import { formatDate, formatPeso } from "@/lib/time";
import { cn } from "@/lib/utils";

// Owner settings. Dull and important. Six pages under one sub navigation,
// every change a command the server applies and writes to the audit trail.

const sections = [
  { segment: "", label: "Clinic" },
  { segment: "services", label: "Services" },
  { segment: "staff", label: "Staff" },
  { segment: "hours", label: "Hours" },
  { segment: "closures", label: "Closures" },
  { segment: "recall", label: "Recall rules" },
];

function SettingsFrame({ title, lead, actions, children }: { title: string; lead?: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const { org, role } = useOrg();
  const base = `/app/${org.slug}/settings`;
  if (!can(role, "view_settings")) return <NotForRole role={roleLabel[role]} page="Settings" />;
  return (
    <>
      <PageHeader title={title} lead={lead} actions={actions} />
      <nav aria-label="Settings" className="mb-6 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {sections.map((s) => {
          const href = s.segment ? `${base}/${s.segment}` : base;
          const active = s.segment ? pathname.startsWith(href) : pathname === base;
          return (
            <Link key={s.label} href={href} aria-current={active ? "page" : undefined} className={cn("h-8 shrink-0 rounded-full px-3 text-label font-medium leading-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page", active ? "bg-action text-on-action" : "bg-sheet text-text-2 hover:text-text")}>
              {s.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}

// The live region stays mounted so the announcement fires when the text
// appears; the text itself is only there while it is true, so a screen reader
// is not told "Saved" on a page nobody has touched.
function Saved({ show }: { show: boolean }) {
  return (
    <span role="status" aria-live="polite" className={cn("flex min-h-5 items-center gap-1 text-label text-text-2 transition-opacity duration-150", show ? "opacity-100" : "opacity-0")}>
      {show ? (
        <>
          <Check className="size-3.5" strokeWidth={2} aria-hidden /> Saved
        </>
      ) : null}
    </span>
  );
}

export function ClinicSettings() {
  const { org, dispatch } = useOrg();
  const [form, setForm] = useState({ name: org.name, address: org.address, city: org.city, mobile: org.mobile, email: org.email, openFrom: org.openFrom, openTo: org.openTo, timezone: org.timezone });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await dispatch({ type: "org/update", changes: form });
    if (r.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    }
  }
  return (
    <SettingsFrame title="Settings" lead="The clinic as pet owners see it.">
      <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex flex-col gap-5 p-6">
          <InputField label="Clinic name" value={form.name} onChange={set("name")} />
          <InputField label="Address" value={form.address} onChange={set("address")} placeholder="Door 3, Velez corner Capistrano" />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="City" value={form.city} onChange={set("city")} placeholder="Cagayan de Oro" />
            <SelectField label="Time zone" value={form.timezone} onChange={(v) => setForm((f) => ({ ...f, timezone: v }))} options={[{ value: "Asia/Manila", label: "Asia/Manila" }]} helper="Appointments show in this zone, labelled." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Mobile" value={form.mobile} onChange={set("mobile")} inputMode="tel" placeholder="0917 555 0142" />
            <InputField label="Email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Opens" type="time" value={form.openFrom} onChange={set("openFrom")} helper="Shown on your public page. Per vet hours are under Hours." />
            <InputField label="Closes" type="time" value={form.openTo} onChange={set("openTo")} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Saved show={saved} />
            <Pill type="submit" size="sm">
              Save changes
            </Pill>
          </div>
        </Card>
        <Card className="flex flex-col gap-3 self-start p-6">
          <p className="text-label font-medium text-text-2">Public booking link</p>
          <p className="break-all text-body tabular">kalinga.cjjutba.dev/{org.slug}</p>
          <p className="text-small text-text-2">This is the link you share. Changing it would break every link already shared, so it is fixed.</p>
          <Pill
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`https://kalinga.cjjutba.dev/${org.slug}`);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? <Check className="size-4" strokeWidth={2} aria-hidden /> : <Copy className="size-4" strokeWidth={1.5} aria-hidden />}
            {copied ? "Copied" : "Copy link"}
          </Pill>
          <Pill asChild size="sm" variant="text">
            <Link href={`/${org.slug}`}>Open the booking page</Link>
          </Pill>
        </Card>
      </form>
    </SettingsFrame>
  );
}

function ServiceDialog({ service, open, onOpenChange }: { service: Service | null | "new"; open: boolean; onOpenChange: (o: boolean) => void }) {
  const confirm = useConfirm();
  const { dispatch } = useOrg();
  const existing = service && service !== "new" ? service : null;
  const [form, setForm] = useState({ name: existing?.name ?? "", durationMin: String(existing?.durationMin ?? 30), bufferMin: String(existing?.bufferMin ?? 0), pricePhp: String(existing?.pricePhp ?? 500), publiclyBookable: existing?.publiclyBookable ?? true, recallKind: existing?.recallKind ?? "" });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Give the service a name pet owners will recognise.");
    setBusy(true);
    const r = await dispatch({ type: "service/upsert", service: { id: existing?.id, name: form.name.trim(), durationMin: Number(form.durationMin) || 30, bufferMin: Number(form.bufferMin) || 0, pricePhp: Number(form.pricePhp) || 0, publiclyBookable: form.publiclyBookable, recallKind: (form.recallKind || undefined) as Service["recallKind"] } });
    setBusy(false);
    if (r.ok) onOpenChange(false);
    else setError(r.error);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-md rounded-sheet border-0 bg-sheet p-6 shadow-lifted">
        <DialogHeader className="text-left">
          <DialogTitle className="text-heading font-medium">{existing ? `Edit ${existing.name}` : "New service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} noValidate className="mt-4 flex flex-col gap-4">
          <InputField label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={error} placeholder="Vaccination" />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Minutes" inputMode="numeric" value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} />
            <InputField label="Buffer" inputMode="numeric" value={form.bufferMin} onChange={(e) => setForm((f) => ({ ...f, bufferMin: e.target.value }))} helper="Minutes after" />
            <InputField label="Price, ₱" inputMode="numeric" value={form.pricePhp} onChange={(e) => setForm((f) => ({ ...f, pricePhp: e.target.value }))} />
          </div>
          <SelectField label="Sets a recall date" value={form.recallKind} onChange={(v) => setForm((f) => ({ ...f, recallKind: v }))} options={[{ value: "", label: "No" }, { value: "vaccination", label: "Vaccination, due yearly" }, { value: "deworming", label: "Deworming, due quarterly" }, { value: "grooming", label: "Grooming, on the clinic interval" }]} />
          <label className="flex items-center gap-2 text-small">
            <input type="checkbox" checked={form.publiclyBookable} onChange={(e) => setForm((f) => ({ ...f, publiclyBookable: e.target.checked }))} className="size-4 accent-[var(--action)]" />
            Pet owners can book this online
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {existing ? (
              <Pill type="button" size="sm" variant="text" onClick={async () => { if (!(await confirm({ title: `Remove ${existing.name}?`, description: "It stops being bookable, online and at the desk. Visits that already used it keep it.", confirmLabel: "Remove" }))) return; const r = await dispatch({ type: "service/archive", id: existing.id }); if (r.ok) onOpenChange(false); }}>
                Archive
              </Pill>
            ) : <span />}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Pill type="button" size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Pill>
              <Pill type="submit" size="sm" loading={busy} loadingLabel="Saving">
                {existing ? "Save" : "Add service"}
              </Pill>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesSettings() {
  const { services } = useOrg();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  return (
    <SettingsFrame
      title="Services"
      lead="What can be booked, how long it takes, and what it costs."
      actions={
        <Pill size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden /> Add service
        </Pill>
      }
    >
      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-heading font-medium">No services yet</p>
          <p className="mx-auto mt-2 max-w-sm text-small text-text-2">Consultation, vaccination, deworming and grooming are the usual four. Add one and the public booking page opens.</p>
          <Pill size="sm" className="mt-4" onClick={() => setEditing("new")}>
            Add your first service
          </Pill>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setEditing(s)} className="w-full rounded-card bg-sheet p-5 text-left hover:bg-divider/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-body font-medium">{s.name}</p>
                  <p className="text-body tabular">{formatPeso(s.pricePhp)}</p>
                </div>
                <p className="mt-1 text-small text-text-2">
                  {s.durationMin} min{s.bufferMin ? `, ${s.bufferMin} min buffer` : ""}
                  {s.recallKind ? `, sets ${s.recallKind} recall` : ""}
                </p>
                <p className="mt-2 text-label text-text-2">{s.publiclyBookable ? "Bookable online" : "Desk only"}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing ? <ServiceDialog key={editing === "new" ? "new" : editing.id} service={editing} open onOpenChange={(o) => !o && setEditing(null)} /> : null}
    </SettingsFrame>
  );
}

export function StaffSettings() {
  const confirm = useConfirm();
  const { members, invitations, providers, actorMemberId, dispatch } = useOrg();
  const [form, setForm] = useState({ email: "", role: "front_desk" as Role });
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!form.email.includes("@")) return setError("A real email, so the invitation has somewhere to go.");
    setError(undefined);
    setBusy(true);
    const r = await dispatch({ type: "member/invite", member: { email: form.email.trim(), role: form.role } });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setNotice(r.message);
    setForm({ email: "", role: "front_desk" });
  }
  return (
    <SettingsFrame title="Staff and permissions" lead="Every permission is checked on the server. Hiding a button is not a permission.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card className="p-2">
            <ul className="divide-y divide-divider">
              {members.map((m) => {
                const provider = providers.find((p) => p.id === m.providerId);
                const isYou = m.id === actorMemberId;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium">
                        {m.name} {isYou ? <span className="text-label font-normal text-text-2">you</span> : null}
                      </p>
                      <p className="truncate text-small text-text-2">
                        {m.email}
                        {provider ? `, ${provider.title.toLowerCase()} on the schedule` : ""}
                      </p>
                    </div>
                    <SelectField label="Role" value={m.role} onChange={(v) => dispatch({ type: "member/role", id: m.id, role: v as Role })} options={staffRoles.map((r) => ({ value: r, label: roleLabel[r] }))} className="w-40" disabled={isYou} />
                    <button type="button" onClick={async () => { if (!(await confirm({ title: `Remove ${m.name}?`, description: "They lose access on their next click. Their name stays on everything they did.", confirmLabel: "Remove" }))) return; dispatch({ type: "member/remove", id: m.id }); }} disabled={isYou} aria-label={`Remove ${m.name}`} className="grid size-10 place-items-center self-end rounded-full text-text-2 hover:bg-field hover:text-text disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      <Trash2 className="size-5" strokeWidth={1.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          {invitations.length ? (
            <Card className="p-2">
              <p className="px-3 pt-2 text-label font-medium text-text-2">Invited, not yet joined</p>
              <ul className="divide-y divide-divider">
                {invitations.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body">{i.email}</p>
                      <p className="text-small text-text-2">
                        {roleLabel[i.role]}, invited {formatDate(i.createdAt)}, expires {formatDate(i.expiresAt)}
                      </p>
                    </div>
                    <button type="button" onClick={async () => { if (!(await confirm({ title: `Cancel the invitation to ${i.email}?`, description: "The link stops working. You can invite them again any time.", confirmLabel: "Cancel it", cancelLabel: "Keep it" }))) return; dispatch({ type: "invitation/cancel", id: i.id }); }} aria-label={`Cancel invitation to ${i.email}`} className="grid size-10 place-items-center rounded-full text-text-2 hover:bg-field hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      <Trash2 className="size-5" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
        <form onSubmit={invite} noValidate className="flex flex-col gap-4 self-start rounded-card bg-sheet p-6">
          <h2 className="text-heading font-medium">Invite someone</h2>
          <InputField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={error} placeholder="maria@clinic.com" />
          <SelectField label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v as Role }))} options={staffRoles.map((r) => ({ value: r, label: roleLabel[r] }))} helper={roleDescription[form.role]} />
          <Pill type="submit" size="sm" loading={busy} loadingLabel="Inviting">
            Send invitation
          </Pill>
          {notice ? (
            <p role="status" className="break-all text-label text-text-2">
              {notice}
            </p>
          ) : (
            <p className="text-label text-text-2">They get a link that works for seven days. Vets and groomers also need a place on the schedule, under Hours.</p>
          )}
        </form>
      </div>
    </SettingsFrame>
  );
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ProviderHours({ provider }: { provider: Provider }) {
  const confirm = useConfirm();
  const { dispatch } = useOrg();
  const [saved, setSaved] = useState(false);
  const rules = provider.weeklyHours;
  async function update(next: WeeklyRule[]) {
    const r = await dispatch({ type: "provider/upsert", provider: { id: provider.id, name: provider.name, title: provider.title, memberId: provider.memberId ?? null, weeklyHours: next } });
    if (r.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    }
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-body font-medium">{provider.name}</h2>
          <p className="text-small text-text-2">{provider.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Saved show={saved} />
          <button type="button" onClick={async () => { if (!(await confirm({ title: `Remove ${provider.name} from the schedule?`, description: "Their hours stop being offered to pet owners. Appointments already booked with them stay where they are.", confirmLabel: "Remove" }))) return; dispatch({ type: "provider/archive", id: provider.id }); }} aria-label={`Remove ${provider.name} from the schedule`} className="grid size-9 place-items-center rounded-full text-text-2 hover:bg-field hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {dayNames.map((d, day) => {
          const rule = rules.find((r) => r.day === day);
          return (
            <li key={day} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 sm:grid-cols-[3.5rem_auto_1fr]">
              <label className="flex items-center gap-2 text-small font-medium">
                <input type="checkbox" checked={!!rule} onChange={(e) => update(e.target.checked ? [...rules, { day, from: "09:00", to: "18:00" }].sort((a, b) => a.day - b.day) : rules.filter((r) => r.day !== day))} className="size-4 accent-[var(--action)]" />
                {d}
              </label>
              {rule ? (
                <div className="flex min-w-0 items-center gap-2 text-small tabular">
                  <input type="time" value={rule.from} onChange={(e) => update(rules.map((r) => (r.day === day ? { ...r, from: e.target.value } : r)))} className="h-9 w-full min-w-0 rounded-tag bg-field px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label={`${d} opens`} />
                  <span className="text-text-2">to</span>
                  <input type="time" value={rule.to} onChange={(e) => update(rules.map((r) => (r.day === day ? { ...r, to: e.target.value } : r)))} className="h-9 w-full min-w-0 rounded-tag bg-field px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label={`${d} closes`} />
                </div>
              ) : (
                <span className="text-small text-text-2">Off</span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function HoursSettings() {
  const { providers, members, dispatch } = useOrg();
  const [form, setForm] = useState({ name: "", title: "Vet" as Provider["title"], memberId: "" });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const unlinked = members.filter((m) => !providers.some((p) => p.memberId === m.id));
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("The name as it appears on the booking page.");
    setError(undefined);
    setBusy(true);
    const r = await dispatch({ type: "provider/upsert", provider: { name: form.name.trim(), title: form.title, memberId: form.memberId || null } });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setForm({ name: "", title: "Vet", memberId: "" });
  }
  return (
    <SettingsFrame title="Working hours" lead="Who is on the schedule and when. The slot picker reads these directly. Closures and leave are under Closures.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          {providers.length === 0 ? <Card className="p-6 text-small text-text-2">Nobody is on the schedule yet. Add a vet or groomer and their hours become bookable.</Card> : providers.map((p) => <ProviderHours key={p.id} provider={p} />)}
        </div>
        <form onSubmit={add} noValidate className="flex flex-col gap-4 self-start rounded-card bg-sheet p-6">
          <h2 className="text-heading font-medium">Add to the schedule</h2>
          <InputField label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={error} placeholder="Dr. Ana Reyes" />
          <SelectField label="Role on the schedule" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v as Provider["title"] }))} options={[{ value: "Vet", label: "Vet" }, { value: "Groomer", label: "Groomer" }]} helper="Groomers only take grooming bookings." />
          <SelectField
            label="Signs in as"
            hint="Optional"
            value={form.memberId}
            onChange={(v) => setForm((f) => ({ ...f, memberId: v, name: f.name || members.find((m) => m.id === v)?.name || "" }))}
            options={[{ value: "", label: "No account, schedule only" }, ...unlinked.map((m) => ({ value: m.id, label: `${m.name}, ${roleLabel[m.role]}` }))]}
            helper="Linking a member lets a vet see their own column."
          />
          <Pill type="submit" size="sm" loading={busy} loadingLabel="Adding">
            Add with default hours
          </Pill>
          <p className="text-label text-text-2">Default hours are Monday to Saturday at the clinic&apos;s opening times. Adjust per day on the left.</p>
        </form>
      </div>
    </SettingsFrame>
  );
}

export function ClosuresSettings() {
  const confirm = useConfirm();
  const { org, providers, dispatch } = useOrg();
  const [form, setForm] = useState({ date: "", reason: "", who: "all" });
  const [error, setError] = useState<string | undefined>();
  const all = providers.flatMap((p) => p.exceptions.map((e) => ({ ...e, provider: p }))).sort((a, b) => a.date.localeCompare(b.date));
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.date) return setError("Pick the date.");
    setError(undefined);
    const targets = form.who === "all" ? providers : providers.filter((p) => p.id === form.who);
    for (const p of targets) {
      if (p.exceptions.some((x) => x.date === form.date)) continue;
      await dispatch({ type: "provider/upsert", provider: { id: p.id, name: p.name, title: p.title, memberId: p.memberId ?? null, exceptions: [...p.exceptions, { date: form.date, reason: form.reason.trim() || "Closed" }] } });
    }
    setForm({ date: "", reason: "", who: "all" });
  }
  return (
    <SettingsFrame title="Closures and leave" lead="Days the slot picker will not offer. The whole clinic, or one person.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-2">
          {all.length ? (
            <ul className="divide-y divide-divider">
              {all.map((x) => (
                <li key={`${x.provider.id}-${x.date}`} className="flex items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium tabular">{formatDate(x.date, org.timezone)}</p>
                    <p className="text-small text-text-2">
                      {x.reason}, {x.provider.name}
                    </p>
                  </div>
                  <button type="button" onClick={async () => { if (!(await confirm({ title: "Remove this closure?", description: `${formatDate(x.date, org.timezone)} opens for booking again for ${x.provider.name}.`, confirmLabel: "Remove" }))) return; dispatch({ type: "provider/upsert", provider: { id: x.provider.id, name: x.provider.name, title: x.provider.title, memberId: x.provider.memberId ?? null, exceptions: x.provider.exceptions.filter((e) => e.date !== x.date) } }); }} aria-label={`Remove closure on ${x.date} for ${x.provider.name}`} className="grid size-10 place-items-center rounded-full text-text-2 hover:bg-field hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    <Trash2 className="size-5" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-10 text-center text-small text-text-2">No closures ahead. The clinic is open every day it says it is.</p>
          )}
        </Card>
        <form onSubmit={add} noValidate className="flex flex-col gap-4 self-start rounded-card bg-sheet p-6">
          <h2 className="text-heading font-medium">Add a closure</h2>
          <InputField label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} error={error} />
          <InputField label="Reason" hint="Optional" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Fiesta, clinic closed" />
          <SelectField label="Who" value={form.who} onChange={(v) => setForm((f) => ({ ...f, who: v }))} options={[{ value: "all", label: "Whole clinic" }, ...providers.map((p) => ({ value: p.id, label: p.name }))]} />
          <Pill type="submit" size="sm" disabled={providers.length === 0}>
            Add closure
          </Pill>
        </form>
      </div>
    </SettingsFrame>
  );
}

export function RecallSettings() {
  const { org, dispatch } = useOrg();
  const [weeks, setWeeks] = useState(String(org.groomingIntervalWeeks));
  const [saved, setSaved] = useState(false);
  const sample = { petName: "Kiko", ownerName: "Maria", clinicName: org.name, dueOn: "2026-10-02", bookingUrl: `kalinga.cjjutba.dev/${org.slug}` };
  const booking = { petName: "Kiko", ownerName: "Maria", clinicName: org.name, serviceName: "Vaccination", when: "Fri 2 Oct, 9:30 AM PHT", reference: "KLG-4F7Q", manageUrl: `kalinga.cjjutba.dev/${org.slug}/b/KLG-4F7Q` };
  const previews: Record<string, string> = {
    booking_confirmation: renderBookingConfirmation(booking),
    booking_changed: renderBookingChanged(booking, "rescheduled"),
    vaccination: renderReminder("vaccination", sample),
    deworming: renderReminder("deworming", sample),
    grooming: renderReminder("grooming", sample),
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    const n = Math.min(12, Math.max(2, Number(weeks) || org.groomingIntervalWeeks));
    setWeeks(String(n));
    const r = await dispatch({ type: "org/update", changes: { groomingIntervalWeeks: n } });
    if (r.ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    }
  }
  return (
    <SettingsFrame title="Recall rules" lead="What decides that an animal is due, and the words the desk sends.">
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <form onSubmit={save} noValidate className="flex flex-col gap-4 self-start rounded-card bg-sheet p-6">
          <h2 className="text-heading font-medium">Intervals</h2>
          <dl className="flex flex-col gap-2 text-small">
            <div className="flex justify-between">
              <dt className="text-text-2">Vaccination</dt>
              <dd>Yearly from the last dose</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-2">Deworming</dt>
              <dd>Every three months</dd>
            </div>
          </dl>
          <InputField label="Grooming, every" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} helper="Weeks. Four to six is usual." />
          <div className="flex items-center justify-end gap-3">
            <Saved show={saved} />
            <Pill type="submit" size="sm">
              Save
            </Pill>
          </div>
        </form>
        <div className="flex flex-col gap-3">
          {templateCatalogue.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-body font-medium">{t.name}</h3>
                <span className="text-label text-text-2">{t.when}</span>
              </div>
              <blockquote className="mt-3 rounded-guide bg-field p-3.5 text-small leading-[1.5]">{previews[t.id]}</blockquote>
            </Card>
          ))}
          <p className="text-label text-text-2">Wording is fixed in v1 and written to be pasted into Messenger or a text. Editable templates come when a clinic asks for them.</p>
        </div>
      </div>
    </SettingsFrame>
  );
}
