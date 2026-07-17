import "server-only";
import { adminDb } from "./firebase-admin";

export interface ServerPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  author?: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ServerQuote {
  id: string;
  body: string;
  author: string;
  publishedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ServerGeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface ServerJournalEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  author?: string;
  tripId?: string | null;
  gallery?: string[];
  location: ServerGeoLocation | null;
  tags: string[];
  status: "draft" | "published";
  publishedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ServerTrip {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  author?: string;
  status: "draft" | "published";
  publishedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const postsRef = adminDb.collection("posts");
const quotesRef = adminDb.collection("quotes");
const journalRef = adminDb.collection("journal");
const tripsRef = adminDb.collection("trips");

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

export async function getQuotesServer(): Promise<ServerQuote[]> {
  const snapshot = await quotesRef.orderBy("publishedAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ServerQuote));
}

export async function getJournalBySlugServer(
  slug: string
): Promise<ServerJournalEntry | null> {
  const snapshot = await journalRef.where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as ServerJournalEntry;
}

export async function getPublishedJournalServer(): Promise<ServerJournalEntry[]> {
  try {
    const snapshot = await journalRef
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ServerJournalEntry)
    );
  } catch (error) {
    // A brand-new `journal` collection needs a composite index
    // (status + publishedAt). Until it exists, Firestore throws
    // FAILED_PRECONDITION. Don't let that take down the home page or the
    // build — treat it as "no journal entries yet" and log for diagnosis.
    console.error("getPublishedJournalServer failed:", error);
    return [];
  }
}

export async function getPublishedTripsServer(): Promise<ServerTrip[]> {
  try {
    const snapshot = await tripsRef
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ServerTrip));
  } catch (error) {
    console.error("getPublishedTripsServer failed:", error);
    return [];
  }
}

export async function getTripBySlugServer(slug: string): Promise<ServerTrip | null> {
  const snapshot = await tripsRef.where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as ServerTrip;
}

export async function getTripByIdServer(id: string): Promise<ServerTrip | null> {
  const doc = await tripsRef.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ServerTrip;
}

/** Published journal entries for a trip, in chronological (oldest-first) order. */
export async function getJournalByTripServer(
  tripId: string
): Promise<ServerJournalEntry[]> {
  try {
    const snapshot = await journalRef
      .where("tripId", "==", tripId)
      .where("status", "==", "published")
      .orderBy("publishedAt", "asc")
      .get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ServerJournalEntry)
    );
  } catch (error) {
    // Needs a composite index (tripId + status + publishedAt). Until it's
    // created, degrade gracefully instead of crashing the trip page.
    console.error("getJournalByTripServer failed:", error);
    return [];
  }
}
