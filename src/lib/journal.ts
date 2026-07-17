import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { JournalEntry, GeoLocation } from "@/types/journal";

const journalRef = collection(db, "journal");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function generateExcerpt(html: string, maxLength = 160): string {
  // Turn line breaks and block boundaries into spaces so adjacent
  // paragraphs don't run together; inline tags are stripped without a space.
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|figcaption|tr|section)>/gi, " ");
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export async function getPublishedJournal(max?: number): Promise<JournalEntry[]> {
  const q = max
    ? query(
        journalRef,
        where("status", "==", "published"),
        orderBy("publishedAt", "desc"),
        limit(max)
      )
    : query(
        journalRef,
        where("status", "==", "published"),
        orderBy("publishedAt", "desc")
      );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
}

export async function getAllJournal(): Promise<JournalEntry[]> {
  const q = query(journalRef, orderBy("publishedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
}

export async function getJournalBySlug(slug: string): Promise<JournalEntry | null> {
  const q = query(journalRef, where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as JournalEntry;
}

export async function getJournalById(id: string): Promise<JournalEntry | null> {
  const d = await getDoc(doc(db, "journal", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as JournalEntry;
}

export async function createJournal(data: {
  title: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  location?: GeoLocation | null;
  coverImage?: string;
  gallery?: string[];
  publishedAt?: Date;
}): Promise<string> {
  const now = Timestamp.now();
  const publishedAt =
    data.status === "published"
      ? data.publishedAt
        ? Timestamp.fromDate(data.publishedAt)
        : now
      : null;

  // Firestore rejects `undefined`; only include optional fields when set.
  const payload: Record<string, unknown> = {
    title: data.title,
    slug: slugify(data.title),
    content: data.content,
    excerpt: generateExcerpt(data.content),
    location: data.location ?? null,
    gallery: data.gallery ?? [],
    tags: data.tags,
    status: data.status,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  };
  if (data.coverImage) payload.coverImage = data.coverImage;

  const docRef = await addDoc(journalRef, payload);
  return docRef.id;
}

export async function updateJournal(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    tags: string[];
    status: "draft" | "published";
    slug: string;
    location: GeoLocation | null;
    coverImage: string | null;
    gallery: string[];
    publishedAt: Date;
  }>
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.status !== undefined) updates.status = data.status;
  if (data.location !== undefined) updates.location = data.location;
  if (data.coverImage !== undefined) updates.coverImage = data.coverImage ?? null;
  if (data.gallery !== undefined) updates.gallery = data.gallery;

  if (data.content !== undefined) {
    updates.content = data.content;
    updates.excerpt = generateExcerpt(data.content);
  }

  if (data.publishedAt) {
    updates.publishedAt = Timestamp.fromDate(data.publishedAt);
  } else if (data.status === "published") {
    const existing = await getJournalById(id);
    if (existing && !existing.publishedAt) {
      updates.publishedAt = Timestamp.now();
    }
  }

  await updateDoc(doc(db, "journal", id), updates);
}

export async function deleteJournal(id: string): Promise<void> {
  await deleteDoc(doc(db, "journal", id));
}
