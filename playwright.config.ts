import { defineConfig, devices } from "@playwright/test";

const PORT = 3999;

/**
 * Smoke tests of the production build (`next build` first), served as the
 * Docker image serves it — the standalone server beside its static files —
 * against an API that cannot be reached: what must work with
 * no backend at all — the public pages, the sign-in form's own checks and
 * the dashboard sending the signed-out away.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "cp -R .next/static .next/standalone/.next/ && node .next/standalone/server.js",
    url: `http://127.0.0.1:${PORT}/health`,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      // Nothing listens there: every call to the API fails at once.
      REGISTRY_API_URL: "http://127.0.0.1:9",
    },
  },
});
