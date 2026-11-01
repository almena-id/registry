import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

/** The build with no API reachable. */
const PORT = 3999;
/** The same build against the real API on SQLite (`e2e/demo_api.py`). */
const SIGNED_IN_PORT = 3998;
const API_PORT = 8767;

/**
 * The signed-in flows need a checkout of ../api beside this one (and `uv`):
 * where there is none, as in this repository's own CI, only the smoke tests
 * run. `E2E_SIGNED_IN=0` leaves them out anyway.
 */
const signedIn =
  process.env.E2E_SIGNED_IN !== "0" && existsSync("../api/pyproject.toml");

const portal = (port: number, api: string, copy: boolean) => ({
  command: `${copy ? "cp -R .next/static .next/standalone/.next/ && " : ""}node .next/standalone/server.js`,
  url: `http://127.0.0.1:${port}/health`,
  reuseExistingServer: false,
  env: { PORT: String(port), HOSTNAME: "127.0.0.1", REGISTRY_API_URL: api },
});

/**
 * Tests of the production build (`next build` first), served as the Docker
 * image serves it — the standalone server beside its static files:
 *
 * - `smoke` (`e2e/smoke.spec.ts`), against an API that cannot be reached:
 *   what must work with no backend at all — the public pages, the sign-in
 *   form's own checks and the dashboard sending the signed-out away;
 * - `signed-in` (`e2e/signed-in.spec.ts`), against the real API on a
 *   throwaway SQLite database with the account "Nova University" signed in
 *   (its session in `.e2e/demo.token`): the overview, creating an issuer and
 *   a form, the applications inbox and the account's settings.
 *
 * Every page is also checked for Content Security Policy violations.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: { locale: "en-US" },
  projects: [
    {
      name: "smoke",
      testMatch: "smoke.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://127.0.0.1:${PORT}`,
      },
    },
    ...(signedIn
      ? [
          {
            name: "signed-in",
            testMatch: "signed-in.spec.ts",
            use: {
              ...devices["Desktop Chrome"],
              baseURL: `http://127.0.0.1:${SIGNED_IN_PORT}`,
            },
          },
        ]
      : []),
  ],
  webServer: [
    // Nothing listens there: every call to the API fails at once.
    portal(PORT, "http://127.0.0.1:9", true),
    ...(signedIn
      ? [
          {
            command:
              "PYTHONPATH=../api uv run --project ../api python e2e/demo_api.py .e2e",
            url: `http://127.0.0.1:${API_PORT}/health`,
            reuseExistingServer: false,
            timeout: 180_000,
            stdout: "ignore" as const,
            stderr: "ignore" as const,
          },
          portal(SIGNED_IN_PORT, `http://127.0.0.1:${API_PORT}`, false),
        ]
      : []),
  ],
});
