import { describe, it, expect } from "vitest";
import { transformYoutubeEmbeds } from "./youtubeEmbeds";

// The bug this guards against: a stored embed on the privacy nocookie domain
// with no referrerpolicy gets challenged by YouTube's "confirm you're not a
// bot" gate. transformYoutubeEmbeds must rewrite it to the standard domain and
// add the referrer policy YouTube's player requires.
const STORED_NOCOOKIE =
  '<p>before</p><div data-youtube-video=""><iframe class="rounded-lg overflow-hidden" ' +
  'width="640" height="480" allowfullscreen="true" origin="" rel="1" ' +
  'src="https://www.youtube-nocookie.com/embed/us292UJ69VI?rel=1"></iframe></div><p>after</p>';

describe("transformYoutubeEmbeds", () => {
  it("adds the referrer policy YouTube's player requires", () => {
    const out = transformYoutubeEmbeds(STORED_NOCOOKIE);
    expect(out).toContain('referrerpolicy="strict-origin-when-cross-origin"');
  });

  it("moves the embed off the privacy nocookie domain", () => {
    const out = transformYoutubeEmbeds(STORED_NOCOOKIE);
    expect(out).not.toContain("youtube-nocookie.com");
    expect(out).toContain("https://www.youtube.com/embed/us292UJ69VI");
  });

  it("preserves the video id and surrounding content", () => {
    const out = transformYoutubeEmbeds(STORED_NOCOOKIE);
    expect(out).toContain("us292UJ69VI");
    expect(out).toContain("<p>before</p>");
    expect(out).toContain("<p>after</p>");
  });

  it("leaves content without embeds untouched", () => {
    const plain = "<p>Just a paragraph.</p><img src='https://example.com/a.jpg'>";
    expect(transformYoutubeEmbeds(plain)).toBe(plain);
  });
});
