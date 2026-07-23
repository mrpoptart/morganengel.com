import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Unit tests run in Node with no emulator. Integration tests that need the
    // Firebase emulator live under tests/integration and are run separately.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
