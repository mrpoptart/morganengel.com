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
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["/og-default.png"],
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
