import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getPublicClinic } from "@/lib/db/queries";

export const metadata: Metadata = { title: "Book an appointment", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ clinic: string }> }) {
  const { clinic } = await params;
  const data = await getPublicClinic(clinic);
  if (!data) notFound();
  return <BookingFlow data={data} />;
}
