import { FadeInUp } from "./FadeInUp";

interface QuoteCardProps {
  body: string;
  author: string;
  date: string;
  index?: number;
}

export function QuoteCard({ body, author, date, index = 0 }: QuoteCardProps) {
  const meta = [author, date].filter(Boolean).join(" · ");
  return (
    <FadeInUp className="md:col-span-2" style={{ animationDelay: `${index * 100}ms` }}>
    <figure
      className="card bg-base-200/50 border border-base-content/5"
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
            {meta && (
              <figcaption className="mt-2 text-sm font-mono text-base-content/50">
                {meta}
              </figcaption>
            )}
          </div>
        </div>
      </div>
    </figure>
    </FadeInUp>
  );
}
