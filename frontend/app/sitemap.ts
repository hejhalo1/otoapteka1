import type { MetadataRoute } from "next";
import { fetchAllSlugs } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/mapa`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/o-serwisie`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/regulamin`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const slugs = await fetchAllSlugs();
    const pharmacyPages: MetadataRoute.Sitemap = slugs.map((s) => ({
      url: `${siteUrl}/apteka/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticPages, ...pharmacyPages];
  } catch {
    return staticPages;
  }
}
