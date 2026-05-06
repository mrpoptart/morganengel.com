import { DEFAULT_QUOTE_AUTHOR } from "@/lib/quotes";

interface QuoteCardProps {
  body: string;
  author: string;
  date: string;
  index?: number;
}

export function QuoteCard({ body, author, date, index = 0 }: QuoteCardProps) {
  const showAuthor = author && author !== DEFAULT_QUOTE_AUTHOR;

  return (
    <div
      className="card bg-base-200/50 border border-base-content/5 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-body p-6">
        <span className="text-xs font-mono text-base-content/40 mb-2">
          {date}
        </span>
        <blockquote className="text-lg font-serif italic text-base-content/80 leading-relaxed whitespace-pre-wrap">
          {body}
        </blockquote>
        {showAuthor && (
          <p className="text-sm font-mono text-base-content/40 mt-4">
            — {author}
          </p>
        )}
      </div>
    </div>
  );
}
