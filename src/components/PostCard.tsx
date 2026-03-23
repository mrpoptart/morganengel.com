import Link from "next/link";

interface PostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  index?: number;
}

export function PostCard({
  slug,
  title,
  excerpt,
  date,
  tags,
  index = 0,
}: PostCardProps) {
  return (
    <Link
      href={`/posts/${slug}`}
      className="card bg-base-200/50 border border-base-content/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-body p-6">
        <span className="text-xs font-mono text-base-content/40 mb-2">
          {date}
        </span>
        <h2 className="text-xl font-bold text-base-content hover:text-primary transition-colors">
          {title}
        </h2>
        <p className="text-sm text-base-content/60 mt-2 line-clamp-2">
          {excerpt}
        </p>
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
