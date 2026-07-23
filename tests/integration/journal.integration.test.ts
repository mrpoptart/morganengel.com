import { describe, it, expect } from "vitest";
import {
  getPublishedJournalServer,
  getJournalBySlugServer,
  getTripBySlugServer,
  getJournalByTripServer,
} from "@/lib/posts-server";
import { transformYoutubeEmbeds } from "@/lib/youtubeEmbeds";

// These exercise the real Admin-SDK server queries against the emulator, using
// the committed seed fixture. They cover the full path that renders a journal
// page — the query and the YouTube-embed transform — end to end.
describe("journal server queries (emulator)", () => {
  it("returns the published seed entry", async () => {
    const entries = await getPublishedJournalServer();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.slug === "bullets-go")).toBe(true);
  });

  it("fetches an entry by slug with its stored content", async () => {
    const entry = await getJournalBySlugServer("bullets-go");
    expect(entry).not.toBeNull();
    expect(entry!.title).toBe("Bullet's Go!");
    expect(entry!.content).toContain("data-youtube-video");
  });

  it("renders the stored YouTube embed with the referrer policy YouTube requires", async () => {
    const entry = await getJournalBySlugServer("bullets-go");
    const rendered = transformYoutubeEmbeds(entry!.content);
    expect(rendered).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(rendered).not.toContain("youtube-nocookie.com");
    expect(rendered).toContain("https://www.youtube.com/embed/us292UJ69VI");
  });

  it("links the entry to its trip", async () => {
    const trip = await getTripBySlugServer("test-trip");
    expect(trip).not.toBeNull();
    const entries = await getJournalByTripServer(trip!.id);
    expect(entries.map((e) => e.slug)).toContain("bullets-go");
  });
});
