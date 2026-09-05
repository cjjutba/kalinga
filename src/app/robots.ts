import type { MetadataRoute } from "next";

// Crawlers land on the marketing pages and each clinic's public booking
// page. The staff side, the client portal, auth and the internal design
// sheet are kept out of the index.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/app/", "/me", "/me/", "/design", "/sign-in", "/sign-up", "/reset", "/new", "/invite/", "/api/"],
      },
    ],
    sitemap: "https://kalinga.cjjutba.dev/sitemap.xml",
  };
}
