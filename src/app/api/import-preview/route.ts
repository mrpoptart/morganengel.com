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
  const categoryLinks = Array.from(
    new Set(html.match(/\/family-blog\/category\/[a-z0-9-]+/gi) ?? [])
  ).slice(0, 60);

  const imgSamples = (html.match(/<img\b[^>]*>/gi) ?? []).slice(0, 8);

  // Pagination + gallery markup, to understand multi-page archives and where
  // JS-gallery photos hide.
  const pagIdx = html.search(/blog-pager|blog-pagination|>\s*Previous|>\s*Older|pagination/i);
  const paginationHtml = pagIdx >= 0 ? html.slice(pagIdx, pagIdx + 1200) : "";
  const galIdx = html.search(/wsite-image|imageGallery|gallery|w-gallery|"images":/i);
  const galleryHtml = galIdx >= 0 ? html.slice(galIdx, galIdx + 1600) : "";
  const dataImageAttrs = (html.match(/data-[a-z-]*(?:image|src|gallery)[^=]*="[^"]{0,200}"/gi) ?? []).slice(0, 6);

  return {
    length: html.length,
    markerCounts,
    postLinks,
    archiveLinks,
    categoryLinks,
    imgSamples,
    paginationHtml,
    galleryHtml,
    dataImageAttrs,
    snippet,
  };
}

// Read-only: fetches an archived page and returns the parsed post. Locked to
// web.archive.org so it can't be used to reach anything else.
// Crawl the Weebly blog pagination and collect every post from September 2017
// on (the New Zealand trip), newest pages first, stopping once we page past it.
async function handleNzList() {
  const CUTOFF = Date.parse("2017-09-01T00:00:00Z");
  const seen = new Set<string>();
  const collected: Array<{
    title: string;
    slug: string;
    permalink: string;
    dateISO: string | null;
    dateText: string | null;
    imageCount: number;
  }> = [];
  for (let page = 1; page <= 6; page++) {
    const pageUrl = `https://meneli.weebly.com/family-blog/previous/${page}`;
    const r = await fetch(pageUrl, {
      headers: { "User-Agent": "morganengel-import/1.0" },
    });
    if (!r.ok) break;
    const posts = parseWeeblyListing(await r.text(), pageUrl);
    if (posts.length === 0) break;
    let anyInRange = false;
    for (const p of posts) {
      if (seen.has(p.slug)) continue;
      const ts = p.dateISO ? Date.parse(p.dateISO) : NaN;
      if (!Number.isNaN(ts) && ts >= CUTOFF) {
        seen.add(p.slug);
        collected.push({
          title: p.title,
          slug: p.slug,
          permalink: p.permalink,
          dateISO: p.dateISO,
          dateText: p.dateText,
          imageCount: p.images.length,
        });
        anyInRange = true;
      }
    }
    if (!anyInRange && page > 1) break;
  }
  collected.sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || ""));
  return NextResponse.json({ count: collected.length, posts: collected });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("nzlist") === "1") {
    return handleNzList();
  }
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
