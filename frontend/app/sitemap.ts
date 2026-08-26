import type { MetadataRoute } from "next";
import { fetchAllSlugs, fetchCities } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/apteki`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/mapa`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/o-serwisie`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/regulamin`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [pharmacyPages, cityPages] = await Promise.all([
    fetchAllSlugs()
      .then((slugs) =>
        slugs.map<MetadataRoute.Sitemap[number]>((s) => ({
          url: `${siteUrl}/apteka/${s.slug}`,
          lastModified: s.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        })),
      )
      .catch(() => []),
    fetchCities()
      .then((cities) => {
        const voivodeships = new Map<string, MetadataRoute.Sitemap[number]>();
        const cityUrls: MetadataRoute.Sitemap = [];
        for (const c of cities) {
          voivodeships.set(c.voivodeshipSlug, {
            url: `${siteUrl}/apteki/${c.voivodeshipSlug}`,
            changeFrequency: "weekly",
            priority: 0.5,
          });
          cityUrls.push({
            url: `${siteUrl}/apteki/${c.voivodeshipSlug}/${c.citySlug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
        return [...voivodeships.values(), ...cityUrls];
      })
      .catch(() => []),
  ]);

  return [...staticPages, ...pharmacyPages, ...cityPages];
}
