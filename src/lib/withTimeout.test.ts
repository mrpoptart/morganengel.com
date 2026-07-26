import { describe, it, expect } from "vitest";
import { withTimeout, TimeoutError } from "./withTimeout";

describe("withTimeout", () => {
  it("resolves with the value when the promise settles in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });

  it("propagates the original rejection", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("boom")), 1000)
    ).rejects.toThrow("boom");
  });

  it("rejects with a TimeoutError when the promise hangs", async () => {
    const neverSettles = new Promise<void>(() => {});
    await expect(withTimeout(neverSettles, 10)).rejects.toBeInstanceOf(
      TimeoutError
    );
  });
});
