import Link from "next/link";
import AdminEditLink from "@/app/posts/[slug]/AdminEditLink";
import { LocationMap } from "@/components/LocationMap";
import { Gallery } from "@/components/Gallery";
import type { GeoLocation } from "@/types/journal";

interface JournalContentProps {
  slug: string;
  title: string;
  content: string;
  coverImage?: string;
  gallery: string[];
  location: GeoLocation | null;
  date: string;
  tags: string[];
  readingTime: string;
  author?: string;
  tripTitle?: string;
  tripSlug?: string;
}

export default function JournalContent({
  slug,
  title,
  content,
  coverImage,
  gallery,
  location,
  date,
  tags,
  readingTime,
  author,
  tripTitle,
  tripSlug,
}: JournalContentProps) {
  const backHref = tripSlug ? `/trips/${tripSlug}` : "/trips";
  const backLabel = tripTitle ? `Back to ${tripTitle}` : "All trips";
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 animate-fade-in-up">
      <Link
        href={backHref}
        className="text-sm font-mono text-base-content/40 hover:text-primary mb-8 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </Link>

      <h1 className="text-3xl lg:text-4xl font-bold font-mono leading-tight mt-6">
        {title}
      </h1>

      <div className="flex items-center gap-4 mt-4 text-sm text-base-content/50 flex-wrap">
        <span className="font-mono">{date}</span>
        {author && (
          <>
            <span>&middot;</span>
            <span className="font-mono">by {author}</span>
          </>
        )}
        <span>&middot;</span>
        <span>{readingTime}</span>
        {location?.label && (
          <>
            <span>&middot;</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <circle cx="12" cy="11" r="3" strokeWidth={2} />
              </svg>
              {location.label}
            </span>
          </>
        )}
        {tags.length > 0 && <span>&middot;</span>}
        <div className="flex gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="badge badge-sm badge-outline hover:badge-primary transition-colors duration-200"
            >
              {tag}
            </Link>
          ))}
        </div>
        <AdminEditLink slug={slug} basePath="/admin/edit-journal" />
      </div>

      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt={title}
          className="w-full rounded-xl mt-8 border border-base-content/10"
        />
      )}

      <div className="divider mt-8" />

      <div
        className="prose prose-invert prose-lg max-w-none prose-blog"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <Gallery images={gallery} />

      {location && (
        <div className="mt-12">
          <h2 className="text-sm font-mono text-base-content/40 mb-3 uppercase tracking-wide">
            {location.label ?? "Location"}
          </h2>
          <LocationMap
            lat={location.lat}
            lng={location.lng}
            zoom={12}
            interactive
            className="h-80 w-full rounded-xl overflow-hidden border border-base-content/10 z-0"
          />
        </div>
      )}
    </article>
  );
}
