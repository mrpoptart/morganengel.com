import { Timestamp } from "firebase/firestore";

export interface GeoLocation {
  lat: number;
  lng: number;
  /** Human-readable place name, e.g. "Kyoto, Japan". */
  label?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  author?: string;
  gallery: string[];
  location: GeoLocation | null;
  tags: string[];
  status: "draft" | "published";
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
