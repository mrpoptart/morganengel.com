// Seeds the Firestore emulator with a minimal, representative dataset. This is
// the committed test fixture: readable, diffable, and it runs identically
// locally and in CI. Grow it as features need coverage.
//
// Used two ways:
//   - `npm run emulator:seed` runs this file directly against a running emulator.
//   - the integration test's globalSetup imports seed() and runs it.
//
// Requires FIRESTORE_EMULATOR_HOST to point at the emulator (the npm scripts and
// `firebase emulators:exec` set it automatically).
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export async function seed() {
  if (getApps().length === 0) {
    initializeApp({ projectId: "demo-morganengelcom" });
  }
  const db = getFirestore();
  const now = Timestamp.fromDate(new Date("2026-07-20T09:16:00.000Z"));

  await db.collection("trips").doc("trip-test").set({
    title: "Test Trip",
    slug: "test-trip",
    description: "A seed trip used by the integration tests.",
    status: "published",
    author: "Morgan Engel",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // A journal entry whose body carries a YouTube embed on the privacy nocookie
  // domain — the exact shape transformYoutubeEmbeds must repair on render.
  const content =
    "<p>The bullet train was fast.</p>" +
    '<div data-youtube-video=""><iframe class="rounded-lg overflow-hidden" ' +
    'width="640" height="480" allowfullscreen="true" origin="" rel="1" ' +
    'src="https://www.youtube-nocookie.com/embed/us292UJ69VI?rel=1"></iframe></div>' +
    "<p>Then we arrived.</p>";

  await db.collection("journal").doc("journal-bullet").set({
    title: "Bullet's Go!",
    slug: "bullets-go",
    content,
    excerpt: "The bullet train was fast. Then we arrived.",
    location: { lat: 35.0657, lng: 136.8402, label: "Nagoya, Japan" },
    gallery: [],
    tripId: "trip-test",
    tags: ["japan", "trains"],
    status: "published",
    author: "Morgan Engel",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { trips: 1, journal: 1 };
}

// Run directly: `node tests/seed.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then((c) => {
      console.log(`Seeded: ${c.trips} trip, ${c.journal} journal entry.`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
