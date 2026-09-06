"use client";

import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { applyAction } from "@/lib/actions/apply";
import { useToast } from "@/components/primitives/toast";
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
}

const OrgDataContext = createContext<OrgDataValue | null>(null);

export function OrgDataProvider({ snapshot, role, actorMemberId, memberships, emailConfigured, children }: { snapshot: OrgSnapshot; role: Role; actorMemberId: string; memberships: Membership[]; emailConfigured: boolean; children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  // Every command goes through here, so every refusal is reported in one
  // place. Screens that can say something better keep their own message and
  // this is the backstop.
  const dispatch = useCallback(
    async (action: StoreAction): Promise<ActionResult> => {
      const result = await applyAction(snapshot.organisation.slug, action);
      if (!result.ok) toast({ kind: "error", title: "That did not save", detail: result.error });
      else startTransition(() => router.refresh());
      return result;
    },
    [snapshot.organisation.slug, router, toast],
  );

  const value = useMemo<OrgDataValue>(() => ({ snapshot, role, actorMemberId, memberships, emailConfigured, dispatch, pending }), [snapshot, role, actorMemberId, memberships, emailConfigured, dispatch, pending]);
  return <OrgDataContext.Provider value={value}>{children}</OrgDataContext.Provider>;
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
