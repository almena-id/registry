import { expect, test } from "./fixtures";

test("the landing leads with the wallet, and other ways in", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your organisation's identities, in one place",
  );
  await expect(
    page.getByRole("link", { name: "Continue with Almena" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Other ways in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("the sign-in form checks the address before asking the API", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not an address");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Enter a valid email.")).toBeVisible();
});

test("an unreachable API is said, not a crash", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@acme.com");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(
    page.getByText("The registry cannot be reached. Try again in a moment."),
  ).toBeVisible();
});

test("the dashboard sends the signed-out to sign in", async ({ page }) => {
  await page.goto("/dashboard/forms");
  await expect(page).toHaveURL(/\/login$/);
});

test("the language is the visitor's", async ({ browser }) => {
  const context = await browser.newContext({ locale: "es-ES" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Continuar con Almena" }),
  ).toBeVisible();
  await context.close();
});

test("the health check answers", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
});

// Every language runs to its own lengths: on a phone, no page may scroll
// sideways in any of them.
for (const locale of ["en-GB", "es-ES"]) {
  test(`the public pages fit a phone in ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({
      locale,
      viewport: { width: 360, height: 740 },
    });
    const page = await context.newPage();
    for (const path of ["/", "/login"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await context.close();
  });
}

test("pages forbid framing and carry their security headers", async ({
  request,
}) => {
  const response = await request.get("/login");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
});
