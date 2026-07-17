import type { Metadata } from "next";
import { JournalCard } from "@/components/JournalCard";
import { JournalMapOverview, type JournalPoint } from "@/components/JournalMapOverview";
import { getPublishedJournalServer } from "@/lib/posts-server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Travel Journal",
  description: "Travel journal — entries pinned to the places they happened.",
};

function formatDate(publishedAt: FirebaseFirestore.Timestamp | null): string {
  if (!publishedAt) return "";
  return publishedAt.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function JournalIndexPage() {
  const entries = await getPublishedJournalServer();

  const points: JournalPoint[] = entries
    .filter((e) => e.location)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      lat: e.location!.lat,
      lng: e.location!.lng,
      label: e.location!.label,
    }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-mono font-bold">Travel Journal</h1>
        <p className="text-base-content/50 font-mono text-sm mt-2">
          Entries pinned to the places they happened.
        </p>
      </div>

      {points.length > 0 && (
        <div className="mb-12 animate-fade-in-up">
          <JournalMapOverview
            points={points}
            className="h-[24rem] w-full rounded-xl overflow-hidden border border-base-content/10 z-0"
          />
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-base-content/40 text-center py-12">
          No journal entries yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((e, i) => (
            <JournalCard
              key={e.id}
              slug={e.slug}
              title={e.title}
              excerpt={e.excerpt}
              coverImage={e.coverImage}
              location={e.location}
              date={formatDate(e.publishedAt)}
              tags={e.tags}
              index={i}
              total={entries.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
