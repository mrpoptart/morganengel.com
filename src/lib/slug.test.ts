import { describe, it, expect } from "vitest";
import { slugify, ensureSlug } from "./slug";

describe("slugify", () => {
  it("lowercases, strips punctuation, and hyphenates spaces", () => {
    expect(slugify("Last Full Day in Japan")).toBe("last-full-day-in-japan");
    expect(slugify("Tennoji & Tsutenkaku")).toBe("tennoji-tsutenkaku");
  });

  it("returns empty for titles with no Latin word characters", () => {
    expect(slugify("最後の日")).toBe("");
    expect(slugify("🎌🗼")).toBe("");
  });
});

describe("ensureSlug", () => {
  it("prefers an explicit slug when present", () => {
    expect(ensureSlug("my-custom-slug", "Some Title")).toBe("my-custom-slug");
  });

  it("normalizes a messy explicit slug", () => {
    expect(ensureSlug("My Custom Slug", "Ignored")).toBe("my-custom-slug");
  });

  it("falls back to the title when the slug is empty", () => {
    expect(ensureSlug("", "Last Full Day in Japan")).toBe("last-full-day-in-japan");
    expect(ensureSlug(undefined, "Last Full Day in Japan")).toBe(
      "last-full-day-in-japan"
    );
  });

  it("never returns an empty string, even for unslugifiable input", () => {
    const s = ensureSlug("", "最後の日");
    expect(s).not.toBe("");
    expect(s.startsWith("entry-")).toBe(true);
  });
});
