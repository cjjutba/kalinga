import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kalinga",
    template: "%s | Kalinga",
  },
  description: "Booking, records and recall reminders for veterinary clinics in the Philippines.",
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/app-icon.svg", type: "image/svg+xml" }],
  },
  metadataBase: new URL("https://kalinga.cjjutba.dev"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PH" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh bg-page text-text">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
