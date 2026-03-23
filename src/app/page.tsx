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
    getPublishedPosts(4).then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(189,147,249,0.08), transparent)",
          }}
        />
        <div className="relative">
          <h1 className="text-4xl lg:text-6xl font-bold font-mono bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent animate-fade-in-up">
            Thoughts on code, design
            <br />& the internet
          </h1>
          <p
            className="text-lg text-base-content/50 mt-4 max-w-xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            A personal blog about building things, breaking things, and
            occasionally writing about it.
          </p>
        </div>
      </section>

      {/* Post grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-sm font-mono uppercase tracking-widest text-base-content/40 mb-8">
          Recent posts
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-base-content/40 text-center py-12">
            No posts yet. Check back soon.
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
      </section>
    </div>
  );
}
