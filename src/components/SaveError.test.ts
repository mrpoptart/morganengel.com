import { describe, it, expect } from "vitest";
import { formatSaveError } from "./SaveError";

describe("formatSaveError", () => {
  it("uses the Firebase code and message when present", () => {
    expect(
      formatSaveError({ code: "permission-denied", message: "Missing perms" })
    ).toBe("permission-denied: Missing perms");
  });

  it("falls back to a generic code for a plain Error", () => {
    expect(formatSaveError(new Error("boom"))).toBe("error: boom");
  });

  it("stringifies anything else", () => {
    expect(formatSaveError("weird")).toBe("error: weird");
  });

  it("shows a timeout message without the error prefix", () => {
    const err = { name: "TimeoutError", message: "Timed out — try again." };
    expect(formatSaveError(err)).toBe("Timed out — try again.");
  });
});
