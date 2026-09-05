import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingConfirmation } from "@/components/booking/confirmation";
import { getBookingByReference } from "@/lib/db/queries";

export const metadata: Metadata = { title: "Your booking", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ clinic: string; ref: string }> }) {
  const { clinic, ref } = await params;
  const data = await getBookingByReference(clinic, ref.toUpperCase());
  if (!data) notFound();
  return <BookingConfirmation data={data} />;
}
