import { PostCard } from "@/components/PostCard";
import { QuoteCard } from "@/components/QuoteCard";
import {
  getPublishedPostsServer,
  getQuotesServer,
} from "@/lib/posts-server";

export const revalidate = 60;

type FeedItem =
  | { kind: "post"; id: string; sortKey: number; slug: string; title: string; excerpt: string; date: string; tags: string[] }
  | { kind: "quote"; id: string; sortKey: number; body: string; author: string; date: string };

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
  const [posts, quotes] = await Promise.all([
    getPublishedPostsServer(),
    getQuotesServer(),
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
