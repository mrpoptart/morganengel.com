"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";

export default function TagsPage() {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedPosts().then((posts) => {
      const counts: Record<string, number> = {};
      for (const post of posts) {
        for (const tag of post.tags) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
      setTags(
        Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 animate-fade-in-up">
      <h1 className="text-3xl font-bold font-mono mb-8">Tags</h1>
      {loading ? (
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <p className="text-base-content/40">No tags yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${tag.name}`}
              className="btn btn-outline btn-sm rounded-full font-mono text-xs gap-2 hover:btn-primary transition-all duration-200"
            >
              {tag.name}
              <span className="badge badge-sm badge-primary">{tag.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
