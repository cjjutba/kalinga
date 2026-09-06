"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { applyAction } from "@/lib/actions/apply";
import type { ActionResult, StoreAction } from "@/lib/actions/types";
import type { OrgSnapshot, Organisation, Role } from "@/lib/domain/types";

// The staff shell's data. Loaded on the server per request, handed to the
// browser as plain view models, and refreshed after every action. dispatch()
// keeps the prototype's shape: components send the same commands, the server
// applies them, and the tree re-renders from the database.

export interface Membership {
  organisation: Organisation;
  role: Role;
}

interface OrgDataValue {
  snapshot: OrgSnapshot;
  role: Role;
  actorMemberId: string;
  memberships: Membership[];
  /** Whether Resend is connected, so screens can offer to email rather than only copy. */
  emailConfigured: boolean;
  dispatch: (action: StoreAction) => Promise<ActionResult>;
  pending: boolean;
  lastError: string | null;
  clearError: () => void;
}

const OrgDataContext = createContext<OrgDataValue | null>(null);

export function OrgDataProvider({ snapshot, role, actorMemberId, memberships, emailConfigured, children }: { snapshot: OrgSnapshot; role: Role; actorMemberId: string; memberships: Membership[]; emailConfigured: boolean; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastError, setLastError] = useState<string | null>(null);

  const dispatch = useCallback(
    async (action: StoreAction): Promise<ActionResult> => {
      const result = await applyAction(snapshot.organisation.slug, action);
      if (!result.ok) setLastError(result.error);
      else startTransition(() => router.refresh());
      return result;
    },
    [snapshot.organisation.slug, router],
  );

  const value = useMemo<OrgDataValue>(() => ({ snapshot, role, actorMemberId, memberships, emailConfigured, dispatch, pending, lastError, clearError: () => setLastError(null) }), [snapshot, role, actorMemberId, memberships, emailConfigured, dispatch, pending, lastError]);
  return (
    <OrgDataContext.Provider value={value}>
      {children}
      {lastError ? (
        <div role="alert" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-card bg-sheet p-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          <p className="text-small font-medium">That did not save</p>
          <p className="mt-1 text-small text-text-2">{lastError}</p>
          <button type="button" onClick={() => setLastError(null)} className="mt-3 h-8 rounded-full bg-pill-2 px-3 text-label font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            Close
          </button>
        </div>
      ) : null}
    </OrgDataContext.Provider>
  );
}

/** Everything scoped to the organisation the shell is showing. Same shape the prototype's hook returned. */
export function useOrg(orgSlug?: string) {
  void orgSlug;
  const ctx = useContext(OrgDataContext);
  if (!ctx) throw new Error("useOrg must be used inside OrgDataProvider");
  const { snapshot } = ctx;
  return {
    org: snapshot.organisation,
    members: snapshot.members,
    invitations: snapshot.invitations,
    services: snapshot.services,
    providers: snapshot.providers,
    owners: snapshot.owners,
    pets: snapshot.pets,
    appointments: snapshot.appointments,
    visits: snapshot.visits,
    reminders: snapshot.reminders,
    audit: snapshot.audit,
    role: ctx.role,
    actorMemberId: ctx.actorMemberId,
    memberships: ctx.memberships,
    emailConfigured: ctx.emailConfigured,
    dispatch: ctx.dispatch,
    pending: ctx.pending,
  };
}
