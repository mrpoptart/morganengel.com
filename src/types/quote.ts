import { Timestamp } from "firebase/firestore";

export interface Quote {
  id: string;
  body: string;
  author: string;
  publishedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
