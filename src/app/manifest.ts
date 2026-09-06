import type { MetadataRoute } from "next";

// The install manifest. Staff pin Kalinga to a phone's home screen and it
// opens on their clinic's day. There is no service worker and no offline
// mode: the product is the database, and a stale day view is worse than a
// spinner. Icons are rendered from public/brand/app-icon.svg, whose geometry
// is the source of truth; the maskable variant fills the square so Android
// can cut its own shape without clipping the mark.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalinga",
    short_name: "Kalinga",
    description: "Booking, records and recall reminders for veterinary clinics.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f7",
    theme_color: "#0a0a0a",
    lang: "en-PH",
    categories: ["business", "medical", "productivity"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
