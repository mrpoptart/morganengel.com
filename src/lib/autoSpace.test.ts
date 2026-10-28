import { describe, it, expect } from "vitest";
import { fixPunctuationSpacing } from "./autoSpace";

describe("fixPunctuationSpacing", () => {
  it("adds a space and capitalizes after sentence punctuation", () => {
    expect(fixPunctuationSpacing("hello.how")).toBe("hello. How");
    expect(fixPunctuationSpacing("wow!that")).toBe("wow! That");
    expect(fixPunctuationSpacing("really?yes.")).toBe("really? Yes.");
  });

  it("adds a space without capitalizing after commas and colons", () => {
    expect(fixPunctuationSpacing("apples,pears")).toBe("apples, pears");
    expect(fixPunctuationSpacing("note:bring")).toBe("note: bring");
  });

  it("leaves URLs, emails, paths and domains alone", () => {
    expect(fixPunctuationSpacing("morganengel.com")).toBeNull();
    expect(fixPunctuationSpacing("www.example.com")).toBeNull();
    expect(fixPunctuationSpacing("https://example.com")).toBeNull();
    expect(fixPunctuationSpacing("me@example.com")).toBeNull();
    expect(fixPunctuationSpacing("notes.txt")).toBeNull();
    expect(fixPunctuationSpacing("src/app")).toBeNull();
  });

  it("leaves numbers and abbreviations alone", () => {
    expect(fixPunctuationSpacing("3.5")).toBeNull();
    expect(fixPunctuationSpacing("1,000")).toBeNull();
    expect(fixPunctuationSpacing("e.g.")).toBeNull();
    expect(fixPunctuationSpacing("U.S.")).toBeNull();
    expect(fixPunctuationSpacing("Ph.D.")).toBeNull();
  });

  it("leaves ordinary words alone", () => {
    expect(fixPunctuationSpacing("hello")).toBeNull();
    expect(fixPunctuationSpacing("hello.")).toBeNull();
    expect(fixPunctuationSpacing("don't")).toBeNull();
  });
});
