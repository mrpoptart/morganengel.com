import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getJournalBySlugServer,
  getTripByIdServer,
  getJournalByTripServer,
} from "@/lib/posts-server";
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

  const trip = entry.tripId ? await getTripByIdServer(entry.tripId) : null;
  const publishedTrip = trip && trip.status === "published" ? trip : null;

  // Sibling entries in the same trip, oldest-first (matches the stop order), so
  // readers can page through the journey from post to post.
  let prevEntry: { slug: string; title: string } | null = null;
  let nextEntry: { slug: string; title: string } | null = null;
  let firstEntry: { slug: string; title: string } | null = null;
  if (publishedTrip) {
    const siblings = await getJournalByTripServer(publishedTrip.id);
    const idx = siblings.findIndex((e) => e.id === entry.id);
    if (idx !== -1) {
      if (idx > 0) {
        const p = siblings[idx - 1];
        prevEntry = { slug: p.slug, title: p.title };
      }
      if (idx < siblings.length - 1) {
        const n = siblings[idx + 1];
        nextEntry = { slug: n.slug, title: n.title };
      } else if (siblings.length > 1) {
        // At the end — offer a jump back to the first post.
        const f = siblings[0];
        firstEntry = { slug: f.slug, title: f.title };
      }
    }
  }

  return (
    <JournalContent
      slug={entry.slug}
      title={entry.title}
      content={entry.content}
      coverImage={entry.coverImage}
      gallery={entry.gallery ?? []}
      location={entry.location}
      date={formatDate(entry.publishedAt)}
      tags={entry.tags}
      readingTime={readingTime(entry.content)}
      author={entry.author}
      tripTitle={publishedTrip?.title}
      tripSlug={publishedTrip?.slug}
      prevEntry={prevEntry}
      nextEntry={nextEntry}
      firstEntry={firstEntry}
    />
  );
}
