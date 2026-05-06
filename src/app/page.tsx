"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { QuoteCard } from "@/components/QuoteCard";
import { getPublishedPosts } from "@/lib/posts";
import { getQuotes } from "@/lib/quotes";
import type { Post } from "@/types/post";
import type { Quote } from "@/types/quote";
import type { Timestamp } from "firebase/firestore";

type FeedItem =
  | { kind: "post"; data: Post; sortKey: number }
  | { kind: "quote"; data: Quote; sortKey: number };

function tsToMillis(ts: Timestamp | null | undefined): number {
  return ts?.toMillis?.() ?? 0;
}

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPublishedPosts(), getQuotes()]).then(([posts, quotes]) => {
      const merged: FeedItem[] = [
        ...posts.map<FeedItem>((p) => ({
          kind: "post",
          data: p,
          sortKey: tsToMillis(p.publishedAt),
        })),
        ...quotes.map<FeedItem>((q) => ({
          kind: "quote",
          data: q,
          sortKey: tsToMillis(q.publishedAt),
        })),
      ].sort((a, b) => b.sortKey - a.sortKey);
      setItems(merged);
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
      ) : items.length === 0 ? (
        <p className="text-base-content/40 text-center py-12">
          No posts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, i) =>
            item.kind === "post" ? (
              <PostCard
                key={`post-${item.data.id}`}
                slug={item.data.slug}
                title={item.data.title}
                excerpt={item.data.excerpt}
                date={formatDate(item.data.publishedAt)}
                tags={item.data.tags}
                index={i}
              />
            ) : (
              <QuoteCard
                key={`quote-${item.data.id}`}
                body={item.data.body}
                author={item.data.author}
                date={formatDate(item.data.publishedAt)}
                index={i}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
