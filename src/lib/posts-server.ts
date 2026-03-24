import "server-only";
import { adminDb } from "./firebase-admin";

export interface ServerPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const postsRef = adminDb.collection("posts");

export async function getPostBySlugServer(slug: string): Promise<ServerPost | null> {
  const snapshot = await postsRef.where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as ServerPost;
}

export async function getPublishedPostsServer(): Promise<ServerPost[]> {
  const snapshot = await postsRef
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ServerPost));
}
