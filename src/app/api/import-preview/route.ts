import { NextResponse } from "next/server";
import { parseArchivedPost } from "@/lib/import-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowed(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "web.archive.org";
  } catch {
    return false;
  }
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
