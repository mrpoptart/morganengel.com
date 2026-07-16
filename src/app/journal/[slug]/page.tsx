import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJournalBySlugServer } from "@/lib/posts-server";
import JournalContent from "./JournalContent";

export const revalidate = 60;

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
  const entry = await getJournalBySlugServer(slug);
  if (!entry) return { title: "Entry not found" };

  const image = entry.coverImage ?? "/og-default.png";
  return {
    title: entry.title,
    description: entry.excerpt,
    openGraph: {
      title: entry.title,
      description: entry.excerpt,
      type: "article",
      publishedTime: entry.publishedAt?.toDate().toISOString(),
      tags: entry.tags,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.excerpt,
      images: [image],
    },
  };
}

export default async function JournalEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getJournalBySlugServer(slug);
  if (!entry || entry.status !== "published") notFound();

  return (
    <JournalContent
      slug={entry.slug}
      title={entry.title}
      content={entry.content}
      coverImage={entry.coverImage}
      location={entry.location}
      date={formatDate(entry.publishedAt)}
      tags={entry.tags}
      readingTime={readingTime(entry.content)}
    />
  );
}
