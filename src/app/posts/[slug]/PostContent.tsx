"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface PostContentProps {
  slug: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  readingTime: string;
}

export default function PostContent({ slug, title, content, date, tags, readingTime }: PostContentProps) {
  const { isAdmin } = useAuth();

  return (
    <article className="max-w-3xl mx-auto px-6 py-16 animate-fade-in-up">
      <Link
        href="/"
        className="text-sm font-mono text-base-content/40 hover:text-primary mb-8 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to blog
      </Link>

      <h1 className="text-3xl lg:text-4xl font-bold font-mono leading-tight mt-6">
        {title}
      </h1>

      <div className="flex items-center gap-4 mt-4 text-sm text-base-content/50 flex-wrap">
        <span className="font-mono">{date}</span>
        <span>&middot;</span>
        <span>{readingTime}</span>
        <span>&middot;</span>
        <div className="flex gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="badge badge-sm badge-outline hover:badge-primary transition-colors duration-200"
            >
              {tag}
            </Link>
          ))}
        </div>
        {isAdmin && (
          <>
            <span>&middot;</span>
            <Link
              href={`/admin/edit/${slug}`}
              className="hover:text-primary transition-colors"
            >
              Edit
            </Link>
          </>
        )}
      </div>

      <div className="divider mt-8" />

      <div
        className="prose prose-invert prose-lg max-w-none prose-blog"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
