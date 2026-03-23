"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import type { Post } from "@/types/post";

function formatDate(post: Post): string {
  if (!post.publishedAt?.toDate) return "";
  return post.publishedAt.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, "");
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostBySlug(slug).then((p) => {
      setPost(p);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="skeleton h-12 w-full mb-4" />
        <div className="skeleton h-6 w-64 mb-8" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold font-mono mb-4">Post not found</h1>
        <Link href="/blog" className="text-primary hover:underline font-mono text-sm">
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-16 animate-fade-in-up">
      <Link
        href="/blog"
        className="text-sm font-mono text-base-content/40 hover:text-primary mb-8 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to blog
      </Link>

      <h1 className="text-3xl lg:text-4xl font-bold font-mono leading-tight mt-6">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 mt-4 text-sm text-base-content/50 flex-wrap">
        <span className="font-mono">{formatDate(post)}</span>
        <span>&middot;</span>
        <span>{readingTime(post.content)}</span>
        <span>&middot;</span>
        <div className="flex gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="badge badge-sm badge-outline hover:badge-primary transition-colors duration-200"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      <div className="divider mt-8" />

      <div
        className="prose prose-invert prose-lg max-w-none prose-blog"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
