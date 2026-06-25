import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";
import { getAllPosts } from "@/app/lib/posts";
import { PROJECTS } from "@/data/projects";
import { EXPERIENCE } from "@/data/experience";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages = ["", "/about", "/projects", "/experience", "/certs", "/writing", "/resume"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const projects = PROJECTS.map((p) => ({
    url: `${SITE_URL}/projects/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const stories = EXPERIENCE.filter((e) => e.story).map((e) => ({
    url: `${SITE_URL}${e.story}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  const posts = getAllPosts().map((post) => ({
    url: `${SITE_URL}/writing/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...projects, ...stories, ...posts];
}
