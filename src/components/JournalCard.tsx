import Link from "next/link";

interface JournalCardProps {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  date: string;
  tags: string[];
  author?: string;
  number?: number | null;
  index?: number;
  total?: number;
}

export function JournalCard({
  slug,
  title,
  excerpt,
  coverImage,
  date,
  tags,
  author,
  number,
  index = 0,
  total = 1,
}: JournalCardProps) {
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
    </Link>
  );
}
