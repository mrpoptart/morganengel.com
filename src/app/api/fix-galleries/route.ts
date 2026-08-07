import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { ADMIN_UIDS } from "@/lib/auth";
import { flattenWeeblyGalleries } from "@/lib/import-parse";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Repair posts/journal entries imported with raw Weebly gallery scaffolding
// (nested imageGallery divs + dead lightbox anchors) that renders as a cramped
// float grid. Flatten each to plain images. Preview by default; pass
// { confirm: true } to write. Only docs whose flattened content actually
// differs are counted/updated, so it's safe to re-run.

const COLLECTIONS = ["journal", "posts"] as const;

interface FixRow {
  collection: string;
  id: string;
  title: string;
}

async function planFixes(): Promise<FixRow[]> {
  const fixes: FixRow[] = [];
  for (const col of COLLECTIONS) {
    const snap = await adminDb.collection(col).get();
    for (const doc of snap.docs) {
      const content = (doc.data().content as string | undefined) || "";
      if (!/imageGallery|lightbox/i.test(content)) continue;
      if (flattenWeeblyGalleries(content) === content) continue;
      fixes.push({
        collection: col,
        id: doc.id,
        title: (doc.data().title as string | undefined) || "(untitled)",
      });
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
    const ref = adminDb.collection(f.collection).doc(f.id);
    const snap = await ref.get();
    const content = (snap.data()?.content as string | undefined) || "";
    const next = flattenWeeblyGalleries(content);
    if (next !== content) {
      await ref.update({ content: next, updatedAt: Timestamp.now() });
      fixed++;
    }
  }
  return NextResponse.json({ dryRun: false, fixed, fixes });
}
