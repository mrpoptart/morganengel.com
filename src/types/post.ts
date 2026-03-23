import { Timestamp } from "firebase/firestore";

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
