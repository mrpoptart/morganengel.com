import type { MetadataRoute } from "next";
import { getPublishedPostsServer } from "@/lib/posts-server";

const BASE_URL = "https://morganengel.com";

// Render at request time so newly published posts appear without a redeploy,
// and so the build never depends on Firebase admin credentials (matching how
// the post pages fetch their data per-request).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPostsServer();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/tags`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/posts/${post.slug}`,
    lastModified: (post.updatedAt ?? post.publishedAt)?.toDate(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tagRoutes: MetadataRoute.Sitemap = [...new Set(posts.flatMap((p) => p.tags))].map(
    (tag) => ({
      url: `${BASE_URL}/tags/${encodeURIComponent(tag)}`,
      changeFrequency: "weekly",
      priority: 0.4,
    })
  );

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
