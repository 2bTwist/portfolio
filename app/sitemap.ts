import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";
import { getCatalogue, type CatalogueEntry } from "@/app/lib/catalogue";

const WEIGHT: Record<CatalogueEntry["kind"], { changeFrequency: "monthly" | "yearly"; priority: number }> = {
  page: { changeFrequency: "monthly", priority: 0.8 },
  project: { changeFrequency: "monthly", priority: 0.7 },
  post: { changeFrequency: "yearly", priority: 0.6 },
  tag: { changeFrequency: "monthly", priority: 0.5 },
};

// The indexable pages of the catalogue. Home is the root URL, weighted highest.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return getCatalogue()
    .filter((e) => e.indexable)
    .map((e) => ({
      url: `${SITE_URL}${e.href === "/" ? "" : e.href}`,
      lastModified: e.date ? new Date(e.date) : now,
      changeFrequency: WEIGHT[e.kind].changeFrequency,
      priority: e.href === "/" ? 1 : WEIGHT[e.kind].priority,
    }));
}
