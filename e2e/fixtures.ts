import { readFileSync } from "node:fs";

import { expect, test as base } from "@playwright/test";

/**
 * Playwright's `test`, with every page watched for Content Security Policy
 * violations: one is a test failure, whatever the test checks.
 */
export const test = base.extend<{ cspViolations: string[] }>({
  cspViolations: [
    async ({ context }, use) => {
      const violations: string[] = [];
      const watch = (page: import("@playwright/test").Page) =>
        page.on("console", (message) => {
          if (
            /Content Security Policy|Content-Security-Policy/i.test(
              message.text(),
            )
          )
            violations.push(`${page.url()}: ${message.text()}`);
        });
      context.pages().forEach(watch);
      context.on("page", watch);
      await use(violations);
      expect(violations, "Content Security Policy violations").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** The session of the e2e API's demo account (`e2e/demo_api.py`). */
export function demoSession(): string {
  return readFileSync(".e2e/demo.token", "utf8").trim();
}
