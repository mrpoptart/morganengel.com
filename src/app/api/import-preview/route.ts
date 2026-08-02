import { NextResponse } from "next/server";
import { parseArchivedPost, parseWeeblyListing } from "@/lib/import-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set(["web.archive.org", "meneli.weebly.com"]);

function allowed(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ALLOWED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

// Diagnostic: report which known blog markers appear and dump a snippet of the
// real markup so the parser can be tuned to the actual structure.
function structureReport(html: string) {
  const markers = [
    "blog-post",
    "blog-title-link",
    "blog-title",
    "blog-date",
    "blog-content",
    "blog-readmore",
    "wsite-blog",
    "article",
    "/family-blog/",
    "/archives/",
    "uploads/",
  ];
  const markerCounts: Record<string, number> = {};
  for (const m of markers) markerCounts[m] = html.split(m).length - 1;

  const firstIdx = html.search(/blog-post|blog-title|<article/i);
  const snippet =
    firstIdx >= 0 ? html.slice(firstIdx, firstIdx + 3500) : html.slice(0, 3500);

  // Collect candidate post links and month-archive links.
  const postLinks = Array.from(
    new Set(
      (html.match(/\/family-blog\/[a-z0-9-]+/gi) ?? []).filter(
        (h) => !h.includes("/archives/")
      )
    )
  ).slice(0, 40);
  const archiveLinks = Array.from(
    new Set(html.match(/\/family-blog\/archives\/[0-9-]+/gi) ?? [])
  ).slice(0, 40);

  const imgSamples = (html.match(/<img\b[^>]*>/gi) ?? []).slice(0, 8);

  return { length: html.length, markerCounts, postLinks, archiveLinks, imgSamples, snippet };
}

// Read-only: fetches an archived page and returns the parsed post. Locked to
// web.archive.org so it can't be used to reach anything else.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target || !allowed(target)) {
    return NextResponse.json(
      { error: "Provide a https://web.archive.org/... url" },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "morganengel-import/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }
    const html = await res.text();
    if (searchParams.get("raw") === "1") {
      return NextResponse.json({ length: html.length, html });
    }
    if (searchParams.get("structure") === "1") {
      return NextResponse.json(structureReport(html));
    }
    if (searchParams.get("list") === "1") {
      const posts = parseWeeblyListing(html, target);
      return NextResponse.json({
        count: posts.length,
        posts: posts.map((p) => ({
          title: p.title,
          slug: p.slug,
          permalink: p.permalink,
          dateText: p.dateText,
          dateISO: p.dateISO,
          imageCount: p.images.length,
          images: p.images.slice(0, 4),
          contentLength: p.contentHtml.length,
          excerpt: p.contentHtml
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 200),
        })),
      });
    }
    const parsed = parseArchivedPost(html, target);
    return NextResponse.json({
      title: parsed.title,
      dateText: parsed.dateText,
      dateISO: parsed.dateISO,
      imageCount: parsed.images.length,
      images: parsed.images.slice(0, 30),
      contentLength: parsed.contentHtml.length,
      contentPreview: parsed.contentHtml.slice(0, 6000),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
