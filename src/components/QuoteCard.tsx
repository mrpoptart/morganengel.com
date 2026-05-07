interface QuoteCardProps {
  body: string;
  author: string;
  date: string;
  index?: number;
}

export function QuoteCard({ body, author, date, index = 0 }: QuoteCardProps) {
  return (
    <figure
      className="card bg-base-200/50 border border-base-content/5 animate-fade-in-up md:col-span-2 text-center"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-body items-center px-6 py-10">
        <span
          aria-hidden="true"
          className="font-serif text-6xl leading-none text-primary/30 select-none"
        >
          &ldquo;
        </span>
        <span className="text-xs font-mono text-base-content/40">
          {date}
        </span>
        <blockquote className="mt-2 text-2xl font-serif italic text-base-content leading-snug whitespace-pre-wrap max-w-2xl">
          {body}
        </blockquote>
        {author && (
          <figcaption className="mt-4 text-sm font-mono text-base-content/50">
            — {author}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
