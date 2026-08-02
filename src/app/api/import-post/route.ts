import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { adminDb, adminAuth, adminBucket } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";
import {
  parseArchivedPost,
  parseWeeblyListing,
  nzLocationForTitle,
} from "@/lib/import-parse";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_HOSTS = new Set(["web.archive.org", "meneli.weebly.com"]);

function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ALLOWED_HOSTS.has(u.hostname)
      ? u.hostname
      : null;
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateExcerpt(html: string, maxLength = 160): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|figcaption|tr|section)>/gi, " ");
  const text = withBreaks
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

function extFromContentType(ct: string | null, url: string): string {
  if (ct?.includes("png")) return "png";
  if (ct?.includes("gif")) return "gif";
  if (ct?.includes("webp")) return "webp";
  if (ct?.includes("jpeg") || ct?.includes("jpg")) return "jpg";
  const m = url.match(/\.(png|jpe?g|gif|webp)(?:$|\?)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function uploadRemoteImage(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, {
      headers: { "User-Agent": "morganengel-import/1.0" },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type");
    if (ct && !ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) return null; // skip spacers / 1x1 pixels
    const ext = extFromContentType(ct, src);
    const filename = `images/nz-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const file = adminBucket.file(filename);
    await file.save(buf, { metadata: { contentType: ct ?? "image/jpeg" } });
    await file.makePublic();
    return `https://storage.googleapis.com/${adminBucket.name}/${filename}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // --- Auth: must be a signed-in admin ---
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  let uid: string;
  let name: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    name = decoded.name;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (!ADMIN_UIDS.includes(uid)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const target: string = body.url;
  const host = hostOf(target);
  if (!host) {
    return NextResponse.json(
      { error: "Provide a https URL on an allowed host" },
      { status: 400 }
    );
  }

  // --- Resolve the destination trip (default: New Zealand 2017) ---
  let tripId: string | null = body.tripId || null;
  if (!tripId) {
    const tripSlug: string = body.tripSlug || "new-zealand-2017";
    const t = await adminDb
      .collection("trips")
      .where("slug", "==", tripSlug)
      .limit(1)
      .get();
    if (!t.empty) tripId = t.docs[0].id;
  }

  // --- Fetch + parse ---
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

  let title: string;
  let contentHtmlRaw: string;
  let dateISO: string | null;
  if (host === "meneli.weebly.com") {
    const posts = parseWeeblyListing(html, target);
    if (posts.length === 0) {
      return NextResponse.json({ error: "No post found on page" }, { status: 422 });
    }
    title = posts[0].title;
    contentHtmlRaw = posts[0].contentHtml;
    dateISO = posts[0].dateISO;
  } else {
    const parsed = parseArchivedPost(html, target);
    title = parsed.title;
    contentHtmlRaw = parsed.contentHtml;
    dateISO = parsed.dateISO;
  }

  const slug = slugify(title);

  // --- Dedupe: skip if an entry with this slug already exists ---
  const existing = await adminDb
    .collection("journal")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json({ skipped: true, reason: "already exists", slug, title });
  }

  // --- Re-host images (in parallel) and rewrite the content ---
  const root = parse(contentHtmlRaw);
  const imgEls = root.querySelectorAll("img");
  const srcs = Array.from(
    new Set(
      imgEls
        .map((i) => i.getAttribute("src"))
        .filter((s): s is string => !!s && !s.includes("editmysite.com"))
    )
  );
  const entries = await Promise.all(
    srcs.map(async (s) => [s, await uploadRemoteImage(s)] as const)
  );
  const urlMap = new Map(entries);
  const uploaded: string[] = [];
  for (const img of imgEls) {
    const src = img.getAttribute("src");
    const newUrl = src ? urlMap.get(src) : null;
    if (newUrl) {
      img.setAttribute("src", newUrl);
      img.setAttribute("class", "rounded-lg max-w-full");
      if (!uploaded.includes(newUrl)) uploaded.push(newUrl);
    } else {
      img.remove();
    }
  }
  const contentHtml = root.toString();

  const now = Timestamp.now();
  const publishedAt = dateISO ? Timestamp.fromDate(new Date(dateISO)) : now;
  const location = nzLocationForTitle(title);

  const doc: Record<string, unknown> = {
    title,
    slug,
    content: contentHtml,
    excerpt: generateExcerpt(contentHtml),
    tags: ["travel", "new zealand"],
    location,
    gallery: [],
    tripId,
    author: name ?? "Morgan Engel",
    status: "published",
    publishedAt,
    createdAt: now,
    updatedAt: now,
  };
  if (uploaded.length) doc.coverImage = uploaded[0];

  const ref = await adminDb.collection("journal").add(doc);

  return NextResponse.json({
    created: true,
    id: ref.id,
    slug,
    title,
    imageCount: uploaded.length,
    date: dateISO,
    location: location?.label ?? null,
  });
}
