"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthTitle, PrivacyFooter } from "@/components/auth/auth-shell";
import { InputField } from "@/components/primitives/field";
import { Pill } from "@/components/primitives/pill";
import { GuideCard, Row } from "@/components/primitives/surfaces";
import { useStore } from "@/lib/mock/store";
import { useUiState } from "@/lib/use-ui-state";

// The invitation fixture. The long clinic name is deliberate: the title has to
// wrap to two lines on a phone and still look designed.

const invite = {
  clinic: "Lunhaw Animal Clinic and Grooming Centre",
  inviter: "Dr. Ana Reyes",
  initials: "AR",
  role: "front desk",
  roleLine: "I've set you up as front desk. You'll book, reschedule and check pets in.",
};

export function InviteForm({ token }: { token: string }) {
  const router = useRouter();
  const { dispatch } = useStore();
  const state = useUiState<"signed-in" | "expired">();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function join() {
    setLoading(true);
    dispatch({ type: "role/set", role: "front_desk" });
    window.setTimeout(() => router.push("/app/lunhaw"), 900);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Tell us your name so the clinic knows who booked what.";
    if (password.length < 10) next.password = "Use at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    join();
  }

  if (state === "expired") {
    return (
      <div className="flex flex-col gap-5">
        <AuthTitle lead={`Ask ${invite.inviter} to send a new one.`}>This invitation has expired</AuthTitle>
        <Pill asChild block variant="secondary">
          <Link href="/sign-in">Back to sign in</Link>
        </Pill>
        <PrivacyFooter />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5" data-token={token}>
      <AuthTitle>Join {invite.clinic}</AuthTitle>
      <GuideCard tone="auto" name={invite.inviter} initials={invite.initials}>
        {invite.roleLine}
      </GuideCard>

      {state === "signed-in" ? (
        <>
          <Row
            tone="auto"
            title="Signed in as maria@lunhaw.ph"
            trailing={<span className="grid size-8 place-items-center rounded-full bg-sheet text-label font-medium lg:bg-field">M</span>}
          />
          <Pill type="button" block loading={loading} loadingLabel="Joining" onClick={join}>
            Join as {invite.role}
          </Pill>
          <p className="text-center">
            <Link href="/sign-in" className="text-small font-medium text-text hover:underline">
              Use a different account
            </Link>
          </p>
        </>
      ) : (
        <>
          <InputField on="auto" label="Your name" name="name" autoComplete="name" placeholder="Maria Santos" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} disabled={loading} />
          <InputField
            on="auto"
            label="Choose a password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={loading}
          />
          <Pill type="submit" block loading={loading} loadingLabel="Joining">
            Join clinic
          </Pill>
        </>
      )}
      <PrivacyFooter />
    </form>
  );
}
