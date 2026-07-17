import { Timestamp } from "firebase/firestore";

export interface Trip {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  status: "draft" | "published";
  author?: string;
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
