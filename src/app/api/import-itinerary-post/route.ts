import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { adminDb, adminAuth, adminBucket } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function excerpt(html: string, maxLength = 160): string {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|figcaption|tr|section)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

async function uploadDataUri(src: string): Promise<string | null> {
  const m = src.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return null;
  const ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  const buf = Buffer.from(m[2], "base64");
  if (buf.length < 512) return null;
  const filename = `images/ireland-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const file = adminBucket.file(filename);
  await file.save(buf, { metadata: { contentType: `image/${ext === "jpg" ? "jpeg" : ext}` } });
  await file.makePublic();
  return `https://storage.googleapis.com/${adminBucket.name}/${filename}`;
}

export async function POST(request: Request) {
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let name: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!ADMIN_UIDS.includes(decoded.uid)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    name = decoded.name;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title: string = String(body.title || "").trim();
  const contentIn: string = String(body.content || "");
  if (!title || !contentIn) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }
  const tags: string[] = Array.isArray(body.tags) ? body.tags.map(String) : ["travel", "ireland"];
  const location = body.location ?? null;
  const dateISO: string | null = body.dateISO || null;
  const tripSlug: string = String(body.tripSlug || "ireland-2011");

  // Resolve the trip.
  let tripId: string | null = null;
  const t = await adminDb.collection("trips").where("slug", "==", tripSlug).limit(1).get();
  if (!t.empty) tripId = t.docs[0].id;

  const slug = slugify(title) || `itinerary-${Date.now().toString(36)}`;

  // Dedupe by slug so re-running is safe.
  const existing = await adminDb.collection("journal").where("slug", "==", slug).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ skipped: true, reason: "already exists", slug, title });
  }

  // Upload every inline base64 image (in parallel) and rewrite the content.
  const root = parse(contentIn);
  const imgEls = root.querySelectorAll("img");
  const dataSrcs = Array.from(
    new Set(
      imgEls
        .map((i) => i.getAttribute("src"))
        .filter((s): s is string => !!s && s.startsWith("data:image/"))
    )
  );
  const uploadedPairs = await Promise.all(
    dataSrcs.map(async (s) => [s, await uploadDataUri(s)] as const)
  );
  const urlMap = new Map(uploadedPairs);
  const uploaded: string[] = [];
  for (const img of imgEls) {
    const src = img.getAttribute("src");
    const newUrl = src ? urlMap.get(src) : null;
    if (newUrl) {
      img.setAttribute("src", newUrl);
      img.setAttribute("class", "rounded-lg max-w-full");
      if (!uploaded.includes(newUrl)) uploaded.push(newUrl);
    } else if (src?.startsWith("data:")) {
      img.remove();
    }
  }
  const content = root.toString();

  const now = Timestamp.now();
  const publishedAt = dateISO ? Timestamp.fromDate(new Date(dateISO)) : now;

  const doc: Record<string, unknown> = {
    title,
    slug,
    content,
    excerpt: excerpt(content),
    tags,
    location: location
      ? {
          lat: Number(location.lat),
          lng: Number(location.lng),
          ...(location.label ? { label: String(location.label) } : {}),
        }
      : null,
    gallery: [],
    tripId,
    author: name ?? "Morgan Engel",
    status: "draft",
    publishedAt, // kept so entries sort chronologically once published
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
  });
}
