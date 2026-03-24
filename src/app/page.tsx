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

export default function Home() {
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
      <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
        <img
          src="/morgan.jpeg"
          alt="Morgan"
          className="w-16 h-16 rounded-full object-cover"
        />
        <p className="text-base-content/50 font-mono text-sm">
          super tall lover of life
        </p>
      </div>
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
