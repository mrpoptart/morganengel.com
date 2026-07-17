import Link from "next/link";
import { JournalCard } from "@/components/JournalCard";
import { TripRouteMap, type RoutePoint } from "@/components/TripRouteMap";
import type { GeoLocation } from "@/types/journal";

interface EntryCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  location: GeoLocation | null;
  date: string;
  tags: string[];
  author?: string;
}

interface TripContentProps {
  title: string;
  description: string;
  coverImage?: string;
  author?: string;
  dateRange: string;
  entryCount: number;
  placeCount: number;
  routePoints: RoutePoint[];
  entries: EntryCard[];
}

export default function TripContent({
  title,
  description,
  coverImage,
  author,
  dateRange,
  entryCount,
  placeCount,
  routePoints,
  entries,
}: TripContentProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-fade-in-up">
      <Link
        href="/trips"
        className="text-sm font-mono text-base-content/40 hover:text-primary mb-8 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All trips
      </Link>

      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt={title}
          className="w-full max-h-80 object-cover rounded-xl mt-6 border border-base-content/10"
        />
      )}

      <h1 className="text-3xl lg:text-4xl font-bold font-mono leading-tight mt-8">
        {title}
      </h1>

      <div className="flex items-center gap-3 mt-4 text-sm text-base-content/50 font-mono flex-wrap">
        {dateRange && <span>{dateRange}</span>}
        {dateRange && <span>&middot;</span>}
        <span>
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
        {placeCount > 0 && (
          <>
            <span>&middot;</span>
            <span>
              {placeCount} {placeCount === 1 ? "place" : "places"}
            </span>
          </>
        )}
        {author && (
          <>
            <span>&middot;</span>
            <span>by {author}</span>
          </>
        )}
      </div>

      {description && (
        <p className="text-base-content/70 mt-4 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}

      {routePoints.length > 0 && (
        <TripRouteMap
          points={routePoints}
          className="h-[26rem] w-full rounded-xl overflow-hidden border border-base-content/10 z-0 mt-8"
        />
      )}

      {entries.length === 0 ? (
        <p className="text-base-content/40 text-center py-12 mt-4">
          No entries in this trip yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {entries.map((e, i) => (
            <JournalCard
              key={e.id}
              slug={e.slug}
              title={e.title}
              excerpt={e.excerpt}
              coverImage={e.coverImage}
              location={e.location}
              date={e.date}
              tags={e.tags}
              author={e.author}
              index={i}
              total={entries.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
