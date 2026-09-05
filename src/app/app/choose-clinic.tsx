"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { Pill } from "@/components/primitives/pill";
import { Row } from "@/components/primitives/surfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/mock/store";
import { roleLabel } from "@/lib/roles";
import { useUiState } from "@/lib/use-ui-state";

// A person working at two clinics has two memberships and lands here. Dr. Ana
// Reyes owns Lunhaw and covers at Amihan, so she is the signed in person.

export function ChooseClinic() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const ui = useUiState<"empty" | "loading">();
  const email = "ana@lunhaw.example";
  const memberships = state.members
    .filter((m) => m.email === email)
    .map((m) => ({ member: m, org: state.organisations.find((o) => o.id === m.organisationId)! }))
    .filter((x) => x.org);
  const lastOpened = state.orgId;

  function choose(orgId: string, slug: string) {
    dispatch({ type: "org/set", orgId });
    router.push(`/app/${slug}`);
  }

  if (ui === "empty") {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead="Create one, or open the invitation link you were sent.">You&apos;re not part of a clinic yet</AuthTitle>
        <Pill asChild block>
          <Link href="/new">Create a clinic</Link>
        </Pill>
        <p className="text-center">
          <Link href="/sign-in" className="text-small font-medium text-text hover:underline">
            Sign out
          </Link>
        </p>
        <PrivacyFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AuthTitle>Choose a clinic</AuthTitle>
      {ui === "loading" ? (
        <div className="flex flex-col gap-2" aria-busy>
          <Skeleton className="h-[68px] rounded-guide bg-field lg:bg-sheet" />
          <Skeleton className="h-[68px] rounded-guide bg-field lg:bg-sheet" />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {memberships.map(({ member, org }) => (
            <li key={member.id}>
              <Row
                tone="auto"
                title={org.name}
                secondary={`${roleLabel[member.role]}, ${org.city}`}
                trailing={
                  <>
                    {org.id === lastOpened ? <span className="rounded-full bg-sheet px-2 py-0.5 text-label font-medium text-text-2 lg:bg-field">Last opened</span> : null}
                    <ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />
                  </>
                }
                onClick={() => choose(org.id, org.slug)}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="text-center">
        <Link href="/new" className="text-small font-medium text-text hover:underline">
          Create another clinic
        </Link>
      </p>
      <PrivacyFooter />
    </div>
  );
}
