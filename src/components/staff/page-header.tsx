import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, lead, actions, className }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-title font-medium text-balance">{title}</h1>
        {lead ? <p className="mt-1 text-small text-text-2">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-sheet px-6 py-14 text-center">
      <p className="text-heading font-medium">{title}</p>
      {lead ? <p className="max-w-sm text-small text-text-2">{lead}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function NotForRole({ role, page }: { role: string; page: string }) {
  return (
    <EmptyState title={`${page} is not part of the ${role.toLowerCase()} role`} lead="The server checks every request, so this page holds nothing for your role. Ask the clinic owner if you need it." />
  );
}
