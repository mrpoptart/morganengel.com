import type { Metadata } from "next";
import { TripCard } from "@/components/TripCard";
import { NewTripButton } from "@/components/NewTripButton";
import {
  getPublishedTripsServer,
  getJournalByTripServer,
  type ServerJournalEntry,
} from "@/lib/posts-server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Trips",
  description: "Travel journals, grouped by trip.",
};

function formatDate(ts: FirebaseFirestore.Timestamp): string {
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(entries: ServerJournalEntry[]): string {
  const dated = entries.filter((e) => e.publishedAt);
  if (dated.length === 0) return "";
  const first = dated[0].publishedAt!;
  const last = dated[dated.length - 1].publishedAt!;
  if (first.toMillis() === last.toMillis()) return formatDate(first);
  return `${formatDate(first)} – ${formatDate(last)}`;
}

function placeCount(entries: ServerJournalEntry[]): number {
  const set = new Set<string>();
  for (const e of entries) {
    if (e.location) {
      set.add(
        e.location.label ?? `${e.location.lat.toFixed(3)},${e.location.lng.toFixed(3)}`
      );
    }
  }
  return set.size;
}

export default async function TripsPage() {
  const trips = await getPublishedTripsServer();

  const withStats = await Promise.all(
    trips.map(async (trip) => {
      const entries = await getJournalByTripServer(trip.id);
      return {
        trip,
        entryCount: entries.length,
        placeCount: placeCount(entries),
        dateRange: formatDateRange(entries),
      };
    })
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-start justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-mono font-bold">Trips</h1>
          <p className="text-base-content/50 font-mono text-sm mt-2">
            Travel journals, grouped by trip.
          </p>
        </div>
        <NewTripButton />
      </div>

      {withStats.length === 0 ? (
        <p className="text-base-content/40 text-center py-12">No trips yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {withStats.map(({ trip, entryCount, placeCount, dateRange }, i) => (
            <TripCard
              key={trip.id}
              slug={trip.slug}
              title={trip.title}
              description={trip.description}
              coverImage={trip.coverImage}
              dateRange={dateRange}
              entryCount={entryCount}
              placeCount={placeCount}
              index={i}
              total={withStats.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
