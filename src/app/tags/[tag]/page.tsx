import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { getPublishedPostsServer } from "@/lib/posts-server";

type Props = {
  params: Promise<{ tag: string }>;
};

function formatDate(ts: FirebaseFirestore.Timestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const allPosts = await getPublishedPostsServer();
  const posts = allPosts.filter((p) => p.tags.includes(tag));

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
      {posts.length === 0 ? (
        <p className="text-base-content/40">No posts with this tag.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              date={formatDate(post.publishedAt)}
              tags={post.tags}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
