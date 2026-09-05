import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://undangan.co").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo/"],
        disallow: ["/api/", "/editor/", "/undangan-saya/", "/collaboration/", "/roots/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
