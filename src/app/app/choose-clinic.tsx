"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { Pill } from "@/components/primitives/pill";
import { Row } from "@/components/primitives/surfaces";
import { authClient } from "@/lib/auth-client";
import { roleLabel } from "@/lib/roles";
import type { Membership } from "@/lib/org-data";

export function ChooseClinic({ memberships, mayCreate }: { memberships: Membership[]; /** Only an owner opens another clinic. */ mayCreate: boolean }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (memberships.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead="Create one, or open the invitation link you were sent.">You&apos;re not part of a clinic yet</AuthTitle>
        <Pill asChild block>
          <Link href="/new">Create a clinic</Link>
        </Pill>
        <p className="text-center">
          <button type="button" onClick={signOut} className="text-small font-medium text-text hover:underline">
            Sign out
          </button>
        </p>
        <PrivacyFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AuthTitle>Choose a clinic</AuthTitle>
      <ul className="flex flex-col gap-2">
        {memberships.map(({ organisation, role }) => (
          <li key={organisation.id}>
            <Row tone="auto" title={organisation.name} secondary={`${roleLabel[role]}${organisation.city ? `, ${organisation.city}` : ""}`} trailing={<ChevronRight className="size-5 text-text-2" strokeWidth={1.5} />} href={`/app/${organisation.slug}`} />
          </li>
        ))}
      </ul>
      {mayCreate ? (
        <p className="text-center">
          <Link href="/new" className="text-small font-medium text-text hover:underline">
            Create another clinic
          </Link>
        </p>
      ) : null}
      <p className="text-center">
        <button type="button" onClick={signOut} className="text-small font-medium text-text-2 hover:text-text">
          Sign out
        </button>
      </p>
      <PrivacyFooter />
    </div>
  );
}
