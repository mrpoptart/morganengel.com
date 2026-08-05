import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Find (and optionally delete) blog posts in the `posts` collection that are
// duplicated by a `journal` entry with the same slug. These are the leftover
// copies from the old Hugo blog migration (scripts/import-hugo.mjs) that now
// collide with travel content re-imported into the journal. Only posts that
// have a journal twin are ever touched, so genuine blog posts are left alone.

interface DupRow {
  id: string;
  slug: string;
  title: string;
  journalId: string;
}

async function findDuplicates(): Promise<DupRow[]> {
  const [postsSnap, journalSnap] = await Promise.all([
    adminDb.collection("posts").get(),
    adminDb.collection("journal").get(),
  ]);

  // Map slug -> journal doc id (first wins). Journal is the collection we keep.
  const journalBySlug = new Map<string, string>();
  for (const doc of journalSnap.docs) {
    const slug = (doc.data().slug as string | undefined) || "";
    if (slug && !journalBySlug.has(slug)) journalBySlug.set(slug, doc.id);
  }

  const dups: DupRow[] = [];
  for (const doc of postsSnap.docs) {
    const data = doc.data();
    const slug = (data.slug as string | undefined) || "";
    const journalId = slug ? journalBySlug.get(slug) : undefined;
    if (journalId) {
      dups.push({
        id: doc.id,
        slug,
        title: (data.title as string | undefined) || "(untitled)",
        journalId,
      });
    }
  }
  return dups;
}

export async function POST(request: Request) {
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (!ADMIN_UIDS.includes(uid)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const confirm = body?.confirm === true;

  const dups = await findDuplicates();

  if (!confirm) {
    // Preview only — no writes.
    return NextResponse.json({ dryRun: true, count: dups.length, duplicates: dups });
  }

  let deleted = 0;
  for (const d of dups) {
    await adminDb.collection("posts").doc(d.id).delete();
    deleted++;
  }
  return NextResponse.json({ dryRun: false, deleted, duplicates: dups });
}
