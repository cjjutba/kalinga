import type { Metadata } from "next";
import { DesignSheet } from "./sheet";

export const metadata: Metadata = {
  title: "Design sheet",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  return <DesignSheet />;
}
