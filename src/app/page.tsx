import { PostCard } from "@/components/PostCard";
import { QuoteCard } from "@/components/QuoteCard";
import { JournalCard } from "@/components/JournalCard";
import {
  getPublishedPostsServer,
  getQuotesServer,
  getPublishedJournalServer,
} from "@/lib/posts-server";
import type { GeoLocation } from "@/types/journal";

export const revalidate = 60;

type FeedItem =
  | { kind: "post"; id: string; sortKey: number; slug: string; title: string; excerpt: string; date: string; tags: string[] }
  | { kind: "quote"; id: string; sortKey: number; body: string; author: string; date: string }
  | { kind: "journal"; id: string; sortKey: number; slug: string; title: string; excerpt: string; coverImage?: string; location: GeoLocation | null; date: string; tags: string[] };

function formatDate(ts: FirebaseFirestore.Timestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthYear(ts: FirebaseFirestore.Timestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function Home() {
  const [posts, quotes, journal] = await Promise.all([
    getPublishedPostsServer(),
    getQuotesServer(),
    getPublishedJournalServer(),
  ]);

  const items: FeedItem[] = [
    ...posts.map<FeedItem>((p) => ({
      kind: "post",
      id: p.id,
      sortKey: p.publishedAt?.toMillis() ?? 0,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: formatDate(p.publishedAt),
      tags: p.tags,
    })),
    ...quotes.map<FeedItem>((q) => ({
      kind: "quote",
      id: q.id,
      sortKey: q.publishedAt?.toMillis() ?? 0,
      body: q.body,
      author: q.author,
      date: formatMonthYear(q.publishedAt),
    })),
    ...journal.map<FeedItem>((j) => ({
      kind: "journal",
      id: j.id,
      sortKey: j.publishedAt?.toMillis() ?? 0,
      slug: j.slug,
      title: j.title,
      excerpt: j.excerpt,
      coverImage: j.coverImage,
      location: j.location,
      date: formatDate(j.publishedAt),
      tags: j.tags,
    })),
  ].sort((a, b) => b.sortKey - a.sortKey);

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
      {items.length === 0 ? (
        <p className="text-base-content/40 text-center py-12">
          No posts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-flow-row-dense gap-6">
          {items.map((item, i) =>
            item.kind === "post" ? (
              <PostCard
                key={`post-${item.id}`}
                slug={item.slug}
                title={item.title}
                excerpt={item.excerpt}
                date={item.date}
                tags={item.tags}
                index={i}
                total={items.length}
              />
            ) : item.kind === "journal" ? (
              <JournalCard
                key={`journal-${item.id}`}
                slug={item.slug}
                title={item.title}
                excerpt={item.excerpt}
                coverImage={item.coverImage}
                location={item.location}
                date={item.date}
                tags={item.tags}
                index={i}
                total={items.length}
              />
            ) : (
              <QuoteCard
                key={`quote-${item.id}`}
                body={item.body}
                author={item.author}
                date={item.date}
                index={i}
                total={items.length}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
