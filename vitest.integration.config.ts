import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Integration tests run the real Admin-SDK server queries against the Firebase
// emulator. Launch via `npm run test:integration`, which starts the emulator
// (firebase emulators:exec) and seeds it before vitest runs.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Server modules import Next's `server-only`; stub it under Node.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.js", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/integration/globalSetup.mjs"],
    // The emulator + seed are shared state; keep the suite serial.
    fileParallelism: false,
  },
});
