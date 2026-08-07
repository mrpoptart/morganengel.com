import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Repair documents saved with an empty/missing slug (which makes them
// unreachable — their /journal/… or /posts/… URL collapses to the index).
// For each such doc, derive a slug from the title, keeping it unique within
// its collection. Preview by default; pass { confirm: true } to write.

const COLLECTIONS = ["journal", "posts", "trips"] as const;

interface FixRow {
  collection: string;
  id: string;
  title: string;
  newSlug: string;
}

async function planFixes(): Promise<FixRow[]> {
  const fixes: FixRow[] = [];
  for (const col of COLLECTIONS) {
    const snap = await adminDb.collection(col).get();
    // Slugs already taken in this collection, so backfills don't collide.
    const taken = new Set<string>();
    for (const doc of snap.docs) {
      const s = (doc.data().slug as string | undefined)?.trim();
      if (s) taken.add(s);
    }
    for (const doc of snap.docs) {
      const data = doc.data();
      const slug = (data.slug as string | undefined)?.trim();
      if (slug) continue; // already has one
      const title = (data.title as string | undefined) || "";
      const base = slugify(title) || `entry-${doc.id.slice(0, 6).toLowerCase()}`;
      let candidate = base;
      let i = 2;
      while (taken.has(candidate)) candidate = `${base}-${i++}`;
      taken.add(candidate);
      fixes.push({ collection: col, id: doc.id, title: title || "(untitled)", newSlug: candidate });
    }
  }
  return fixes;
}

export async function POST(request: Request) {
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!ADMIN_UIDS.includes(decoded.uid)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const confirm = body?.confirm === true;

  const fixes = await planFixes();

  if (!confirm) {
    return NextResponse.json({ dryRun: true, count: fixes.length, fixes });
  }

  let fixed = 0;
  for (const f of fixes) {
    await adminDb
      .collection(f.collection)
      .doc(f.id)
      .update({ slug: f.newSlug, updatedAt: Timestamp.now() });
    fixed++;
  }
  return NextResponse.json({ dryRun: false, fixed, fixes });
}
