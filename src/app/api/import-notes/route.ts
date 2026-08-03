import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";
import { NZ_NOTES_POSTS } from "@/lib/nz-notes";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function excerptFrom(paragraphs: string[], maxLength = 160): string {
  const text = paragraphs.join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export async function POST(request: Request) {
  // --- Auth: must be a signed-in admin ---
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
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

  // --- Resolve the New Zealand 2017 trip ---
  const t = await adminDb
    .collection("trips")
    .where("slug", "==", "new-zealand-2017")
    .limit(1)
    .get();
  const tripId = t.empty ? null : t.docs[0].id;

  const results: Array<{ slug: string; title: string; created: boolean; reason?: string }> = [];

  for (const post of NZ_NOTES_POSTS) {
    // Dedupe by slug so re-running is safe.
    const existing = await adminDb
      .collection("journal")
      .where("slug", "==", post.slug)
      .limit(1)
      .get();
    if (!existing.empty) {
      results.push({ slug: post.slug, title: post.title, created: false, reason: "exists" });
      continue;
    }

    const content = post.paragraphs.map((p) => `<p>${p}</p>`).join("");
    const now = Timestamp.now();
    await adminDb.collection("journal").add({
      title: post.title,
      slug: post.slug,
      content,
      excerpt: excerptFrom(post.paragraphs),
      tags: ["travel", "new zealand"],
      location: post.location,
      gallery: [],
      tripId,
      author: name ?? "Morgan Engel",
      status: "published",
      publishedAt: Timestamp.fromDate(new Date(post.dateISO)),
      createdAt: now,
      updatedAt: now,
    });
    results.push({ slug: post.slug, title: post.title, created: true });
  }

  const created = results.filter((r) => r.created).length;
  return NextResponse.json({ created, total: results.length, results });
}
