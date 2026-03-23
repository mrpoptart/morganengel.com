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
import type { Post } from "@/types/post";

const postsRef = collection(db, "posts");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateExcerpt(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]+>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export async function getPublishedPosts(max?: number): Promise<Post[]> {
  const q = max
    ? query(
        postsRef,
        where("status", "==", "published"),
        orderBy("publishedAt", "desc"),
        limit(max)
      )
    : query(
        postsRef,
        where("status", "==", "published"),
        orderBy("publishedAt", "desc")
      );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
}

export async function getAllPosts(): Promise<Post[]> {
  const q = query(postsRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const q = query(postsRef, where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Post;
}

export async function getPostById(id: string): Promise<Post | null> {
  const d = await getDoc(doc(db, "posts", id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Post;
}

export async function createPost(data: {
  title: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt?: Date;
}): Promise<string> {
  const now = Timestamp.now();
  const publishedAt =
    data.status === "published"
      ? data.publishedAt
        ? Timestamp.fromDate(data.publishedAt)
        : now
      : null;
  const docRef = await addDoc(postsRef, {
    title: data.title,
    slug: slugify(data.title),
    content: data.content,
    excerpt: generateExcerpt(data.content),
    tags: data.tags,
    status: data.status,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updatePost(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    tags: string[];
    status: "draft" | "published";
    slug: string;
    publishedAt: Date;
  }>
): Promise<void> {
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (data.content) {
    updates.excerpt = generateExcerpt(data.content);
  }

  if (data.publishedAt) {
    updates.publishedAt = Timestamp.fromDate(data.publishedAt);
  } else if (data.status === "published") {
    const existing = await getPostById(id);
    if (existing && !existing.publishedAt) {
      updates.publishedAt = Timestamp.now();
    }
  } else if (data.status === "draft") {
    updates.publishedAt = null;
  }

  await updateDoc(doc(db, "posts", id), updates);
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, "posts", id));
}
