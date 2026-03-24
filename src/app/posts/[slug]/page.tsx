import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlugServer } from "@/lib/posts-server";
import PostContent from "./PostContent";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(publishedAt: FirebaseFirestore.Timestamp | null): string {
  if (!publishedAt) return "";
  return publishedAt.toDate().toLocaleDateString("en-US", {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugServer(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toDate().toISOString(),
      tags: post.tags,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlugServer(slug);
  if (!post) notFound();

  return (
    <PostContent
      slug={post.slug}
      title={post.title}
      content={post.content}
      date={formatDate(post.publishedAt)}
      tags={post.tags}
      readingTime={readingTime(post.content)}
    />
  );
}
