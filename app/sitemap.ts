import type { MetadataRoute } from "next";
import { templatesCatalog } from "@/templates/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://undangan.co").replace(/\/+$/, "");
  const now = new Date();

  const demoRoutes: MetadataRoute.Sitemap = templatesCatalog.map((template) => ({
    url: `${siteUrl}/demo/${template.code}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...demoRoutes,
  ];
}
