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
import type { Trip } from "@/types/trip";

const tripsRef = collection(db, "trips");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function getPublishedTrips(max?: number): Promise<Trip[]> {
  const q = max
    ? query(
        tripsRef,
        where("status", "==", "published"),
        orderBy("publishedAt", "desc"),
        limit(max)
      )
    : query(
        tripsRef,
        where("status", "==", "published"),
        orderBy("publishedAt", "desc")
      );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

export async function getAllTrips(): Promise<Trip[]> {
  const q = query(tripsRef, orderBy("publishedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  const q = query(tripsRef, where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Trip;
}

export async function getTripById(id: string): Promise<Trip | null> {
  const d = await getDoc(doc(db, "trips", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Trip;
}

export async function createTrip(data: {
  title: string;
  description: string;
  status: "draft" | "published";
  coverImage?: string;
  author?: string;
  publishedAt?: Date;
}): Promise<string> {
  const now = Timestamp.now();
  const publishedAt =
    data.status === "published"
      ? data.publishedAt
        ? Timestamp.fromDate(data.publishedAt)
        : now
      : null;

  const payload: Record<string, unknown> = {
    title: data.title,
    slug: slugify(data.title),
    description: data.description,
    status: data.status,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  };
  if (data.coverImage) payload.coverImage = data.coverImage;
  if (data.author) payload.author = data.author;

  const docRef = await addDoc(tripsRef, payload);
  return docRef.id;
}

export async function updateTrip(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string;
    status: "draft" | "published";
    coverImage: string | null;
    publishedAt: Date;
  }>
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.coverImage !== undefined) updates.coverImage = data.coverImage ?? null;

  if (data.publishedAt) {
    updates.publishedAt = Timestamp.fromDate(data.publishedAt);
  } else if (data.status === "published") {
    const existing = await getTripById(id);
    if (existing && !existing.publishedAt) {
      updates.publishedAt = Timestamp.now();
    }
  }

  await updateDoc(doc(db, "trips", id), updates);
}

export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, "trips", id));
}
