import type { MetadataRoute } from "next";

// Crawlers land on the marketing pages and the public booking page, which
// are backed by the read only demo clinic. The sandbox, the staff side, the
// client portal and the internal design sheet are kept out of the index.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/app/", "/me", "/me/", "/demo", "/demo/", "/design", "/sign-in", "/reset", "/new", "/invite/"],
      },
    ],
    sitemap: "https://kalinga.cjjutba.dev/sitemap.xml",
  };
}
