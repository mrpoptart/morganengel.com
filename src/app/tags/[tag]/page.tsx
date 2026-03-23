"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import type { Post } from "@/types/post";

function formatDate(post: Post): string {
  if (!post.publishedAt?.toDate) return "";
  return post.publishedAt.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TagPage() {
  const params = useParams();
  const tag = params.tag as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedPosts().then((all) => {
      setPosts(all.filter((p) => p.tags.includes(tag)));
      setLoading(false);
    });
  }, [tag]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <span className="badge badge-lg badge-primary font-mono">{tag}</span>
        <Link
          href="/tags"
          className="text-sm text-base-content/40 hover:text-primary transition-colors font-mono"
        >
          Clear filter &times;
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-base-content/40">No posts with this tag.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              date={formatDate(post)}
              tags={post.tags}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
