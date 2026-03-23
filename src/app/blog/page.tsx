"use client";

import { useEffect, useState } from "react";
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

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedPosts().then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold font-mono mb-8 animate-fade-in-up">
        All Posts
      </h1>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-base-content/40 text-center py-12">
          No posts yet.
        </p>
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
