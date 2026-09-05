import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClinicPage } from "@/components/booking/clinic-page";
import { getPublicClinic } from "@/lib/db/queries";

export async function generateMetadata({ params }: { params: Promise<{ clinic: string }> }): Promise<Metadata> {
  const { clinic } = await params;
  const data = await getPublicClinic(clinic);
  return { title: data?.organisation.name ?? "Clinic", description: data ? `Book an appointment at ${data.organisation.name}${data.organisation.city ? ` in ${data.organisation.city}` : ""}.` : undefined };
}

export default async function Page({ params }: { params: Promise<{ clinic: string }> }) {
  const { clinic } = await params;
  const data = await getPublicClinic(clinic);
  if (!data) notFound();
  return <ClinicPage data={data} />;
}
