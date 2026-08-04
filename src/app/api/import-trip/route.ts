import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create (or find) a trip, so category posts can be imported into it. Deduped by
// slug, so re-running just returns the existing trip.
export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const slug: string = String(body.slug || "").trim();
  const title: string = String(body.title || "").trim();
  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title required" }, { status: 400 });
  }
  const description: string = String(body.description || "");
  const publishedAt: Timestamp = body.publishedAt
    ? Timestamp.fromDate(new Date(body.publishedAt))
    : Timestamp.now();

  const existing = await adminDb
    .collection("trips")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json({ tripId: existing.docs[0].id, slug, title, created: false });
  }

  const now = Timestamp.now();
  const ref = await adminDb.collection("trips").add({
    title,
    slug,
    description,
    status: "published",
    author: name ?? "Morgan Engel",
    publishedAt,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ tripId: ref.id, slug, title, created: true });
}
