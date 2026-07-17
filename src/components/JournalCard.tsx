import Link from "next/link";
import { LocationMap } from "@/components/LocationMap";
import type { GeoLocation } from "@/types/journal";

interface JournalCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  location: GeoLocation | null;
  date: string;
  tags: string[];
  author?: string;
  number?: number | null;
  index?: number;
  total?: number;
}

function LocationLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-primary/80">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <circle cx="12" cy="11" r="3" strokeWidth={2} />
      </svg>
      {label}
    </span>
  );
}

export function JournalCard({
  slug,
  title,
  excerpt,
  coverImage,
  location,
  date,
  tags,
  author,
  number,
  index = 0,
  total = 1,
}: JournalCardProps) {
  const showMapTop = !coverImage && location;
  const showMapBottom = coverImage && location;

  return (
    <Link
      href={`/journal/${slug}`}
      className="card bg-base-200/50 border border-base-content/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${Math.round((index / total) * 2000)}ms` }}
    >
      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt={title} className="h-44 w-full object-cover" />
      )}
      {showMapTop && (
        <div className="pointer-events-none">
          <LocationMap
            lat={location.lat}
            lng={location.lng}
            zoom={9}
            className="h-40 w-full"
          />
        </div>
      )}

      <div className="card-body p-6">
        <div className="flex items-center gap-3 flex-wrap">
          {number != null && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-content text-[11px] font-bold font-mono shrink-0"
              aria-label={`Stop ${number}`}
            >
              {number}
            </span>
          )}
          <span className="text-xs font-mono text-base-content/40">
            {date}
            {author && ` · by ${author}`}
          </span>
          <span className="badge badge-xs badge-primary badge-outline">travel journal</span>
          {location?.label && <LocationLabel label={location.label} />}
        </div>
        <h2 className="text-xl font-bold text-base-content hover:text-primary transition-colors">
          {title}
        </h2>
        <p className="text-sm text-base-content/60 mt-2 line-clamp-2">{excerpt}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="badge badge-sm badge-outline hover:badge-primary transition-colors duration-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {showMapBottom && (
        <div className="pointer-events-none">
          <LocationMap
            lat={location.lat}
            lng={location.lng}
            zoom={9}
            className="h-32 w-full"
          />
        </div>
      )}
    </Link>
  );
}
