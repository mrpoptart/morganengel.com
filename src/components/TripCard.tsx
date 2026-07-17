import Link from "next/link";

interface TripCardProps {
  slug: string;
  title: string;
  description: string;
  coverImage?: string;
  dateRange: string;
  entryCount: number;
  placeCount: number;
  index?: number;
  total?: number;
}

export function TripCard({
  slug,
  title,
  description,
  coverImage,
  dateRange,
  entryCount,
  placeCount,
  index = 0,
  total = 1,
}: TripCardProps) {
  return (
    <Link
      href={`/trips/${slug}`}
      className="card bg-base-200/50 border border-base-content/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${Math.round((index / total) * 2000)}ms` }}
    >
      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt={title} className="h-48 w-full object-cover" />
      )}
      <div className="card-body p-6">
        {dateRange && (
          <span className="text-xs font-mono text-base-content/40">{dateRange}</span>
        )}
        <h2 className="text-xl font-bold text-base-content hover:text-primary transition-colors">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex gap-2 mt-4 flex-wrap text-xs font-mono text-base-content/50">
          <span className="badge badge-sm badge-outline">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </span>
          {placeCount > 0 && (
            <span className="badge badge-sm badge-outline">
              {placeCount} {placeCount === 1 ? "place" : "places"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
