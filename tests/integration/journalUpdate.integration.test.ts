import { describe, it, expect, beforeAll } from "vitest";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import {
  createJournal,
  updateJournal,
  getJournalById,
} from "@/lib/journal";
import { ADMIN_UIDS } from "@/lib/auth";
import { transformYoutubeEmbeds } from "@/lib/youtubeEmbeds";

// These run the real CLIENT-SDK write path that the editor's Save/Update
// buttons use — including the security rules — against the emulator, signed in
// as an admin. The point is to prove that editing an existing entry persists
// the change and, crucially, does NOT wipe the fields you didn't touch.
const EMAIL = "admin@test.local";
const PASSWORD = "password1234";

beforeAll(async () => {
  try {
    await adminAuth.createUser({
      uid: ADMIN_UIDS[0],
      email: EMAIL,
      password: PASSWORD,
    });
  } catch (e) {
    // Re-runs against a warm emulator: the user already exists.
    if ((e as { code?: string }).code !== "auth/uid-already-exists") throw e;
  }
  await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
});

const VIDEO_CONTENT =
  "<p>Original body.</p>" +
  '<div data-youtube-video=""><iframe ' +
  'src="https://www.youtube-nocookie.com/embed/us292UJ69VI?rel=1"></iframe></div>';

describe("journal update (client SDK + rules, emulator)", () => {
  it("creates, then updates a single field without losing the rest", async () => {
    const id = await createJournal({
      title: "Draft One",
      content: VIDEO_CONTENT,
      tags: ["a", "b"],
      status: "draft",
      location: { lat: 35.0657, lng: 136.8402, label: "Nagoya, Japan" },
      gallery: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    });

    // Change only the title — mirrors saving after a small edit.
    await updateJournal(id, { title: "Draft One (edited)" });

    const after = await getJournalById(id);
    expect(after).not.toBeNull();
    expect(after!.title).toBe("Draft One (edited)");
    // The work that must NOT be lost:
    expect(after!.content).toBe(VIDEO_CONTENT);
    expect(after!.gallery).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);
    expect(after!.location).toEqual({
      lat: 35.0657,
      lng: 136.8402,
      label: "Nagoya, Japan",
    });
    expect(after!.tags).toEqual(["a", "b"]);
  });

  it("publishing a draft via update sets publishedAt and keeps the content", async () => {
    const id = await createJournal({
      title: "To Publish",
      content: VIDEO_CONTENT,
      tags: [],
      status: "draft",
      location: null,
      gallery: [],
    });

    await updateJournal(id, { status: "published" });

    const after = await getJournalById(id);
    expect(after!.status).toBe("published");
    expect(after!.publishedAt).not.toBeNull();
    expect(after!.content).toBe(VIDEO_CONTENT);
  });

  it("the stored embed still renders with the referrer policy after an update", async () => {
    const id = await createJournal({
      title: "Video Post",
      content: VIDEO_CONTENT,
      tags: [],
      status: "published",
      location: null,
      gallery: [],
    });

    await updateJournal(id, { title: "Video Post (edited)" });

    const after = await getJournalById(id);
    const rendered = transformYoutubeEmbeds(after!.content);
    expect(rendered).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(rendered).not.toContain("youtube-nocookie.com");
  });
});
