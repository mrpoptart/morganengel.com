import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Quote } from "@/types/quote";

const quotesRef = collection(db, "quotes");

export const DEFAULT_QUOTE_AUTHOR = "Morgan Engel";

export async function getQuotes(): Promise<Quote[]> {
  const q = query(quotesRef, orderBy("publishedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Quote));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const d = await getDoc(doc(db, "quotes", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Quote;
}

export async function createQuote(data: {
  body: string;
  author: string;
  publishedAt?: Date;
}): Promise<string> {
  const now = Timestamp.now();
  const publishedAt = data.publishedAt
    ? Timestamp.fromDate(data.publishedAt)
    : now;
  const docRef = await addDoc(quotesRef, {
    body: data.body,
    author: data.author,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateQuote(
  id: string,
  data: Partial<{ body: string; author: string; publishedAt: Date }>
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  if (data.body !== undefined) updates.body = data.body;
  if (data.author !== undefined) updates.author = data.author;
  if (data.publishedAt) {
    updates.publishedAt = Timestamp.fromDate(data.publishedAt);
  }
  await updateDoc(doc(db, "quotes", id), updates);
}

export async function deleteQuote(id: string): Promise<void> {
  await deleteDoc(doc(db, "quotes", id));
}
