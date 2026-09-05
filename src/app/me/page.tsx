import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalSignIn } from "@/components/portal/portal-pages";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Your Kalinga" };

export default async function Page() {
  const session = await getSession();
  if (session) redirect("/me/appointments");
  return <PortalSignIn />;
}
