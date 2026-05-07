interface QuoteCardProps {
  body: string;
  author: string;
  date: string;
  index?: number;
}

export function QuoteCard({ body, author, date, index = 0 }: QuoteCardProps) {
  return (
    <figure
      className="relative px-6 py-8 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-0 font-serif text-7xl leading-none text-primary/30 select-none"
      >
        &ldquo;
      </span>
      <span className="block text-xs font-mono text-base-content/40 mb-3 pl-10">
        {date}
      </span>
      <blockquote className="pl-10 text-2xl font-serif italic text-base-content leading-snug whitespace-pre-wrap">
        {body}
      </blockquote>
      {author && (
        <figcaption className="pl-10 mt-4 text-sm font-mono text-base-content/50">
          — {author}
        </figcaption>
      )}
    </figure>
  );
}
