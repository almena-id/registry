import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests: `app/**/*.test.ts`, in Node. `server-only` throws outside a
// server component, so it is an empty module here; Next's own modules are
// mocked for every test (`test/setup.ts`).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["app/**/*.test.ts"],
    environment: "node",
    setupFiles: ["test/setup.ts"],
  },
});
