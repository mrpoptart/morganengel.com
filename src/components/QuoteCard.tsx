interface QuoteCardProps {
  body: string;
  author: string;
  date: string;
  index?: number;
  total?: number;
}

export function QuoteCard({ body, author, date, index = 0, total = 1 }: QuoteCardProps) {
  return (
    <figure
      className="card bg-base-200/50 border border-base-content/5 animate-fade-in-up md:col-span-2"
      style={{ animationDelay: `${Math.round((index / total) * 2000)}ms` }}
    >
      <div className="card-body py-6">
        <div className="flex items-start gap-3 mx-auto max-w-2xl">
          <span
            aria-hidden="true"
            className="font-serif text-4xl leading-none text-primary/40 select-none -mt-1"
          >
            &ldquo;
          </span>
          <div>
            <blockquote className="text-xl font-serif italic text-base-content leading-snug whitespace-pre-wrap">
              {body}
            </blockquote>
            {(author || date) && (
              <figcaption className="mt-2">
                {author && (
                  <span className="block text-base font-medium text-base-content/80">
                    &mdash; {author}
                  </span>
                )}
                {date && (
                  <span className="block mt-1 text-sm font-mono text-base-content/50">
                    {date}
                  </span>
                )}
              </figcaption>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}
