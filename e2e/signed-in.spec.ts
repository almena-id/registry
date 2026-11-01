import { demoSession, expect, test } from "./fixtures";

// Signed in as the e2e API's account, "Nova University" (`e2e/demo_api.py`):
// its session goes in the portal's cookie, as signing in leaves it. One
// after another: the settings test renames the account and back.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    {
      name: "almena.session",
      value: demoSession(),
      url: baseURL!,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

test("the overview shows the account, its activity and health", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Nova University").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Account health" }),
  ).toBeVisible();
});

test("an issuer is created and opens", async ({ page }) => {
  await page.goto("/dashboard/issuers/new");
  await page.getByLabel("Name").fill("Nova Library");
  await page.getByRole("button", { name: "Create" }).click();
  // Back on the list, beside the one already there.
  await expect(page).toHaveURL(/\/dashboard\/issuers$/);
  await expect(
    page.getByRole("link", { name: "Nova Academic Office" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Nova Library" }).click();
  await expect(page).toHaveURL(/\/dashboard\/issuers\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { name: "Nova Library" }),
  ).toBeVisible();
});

test("a form is created from the catalogue's fields", async ({ page }) => {
  await page.goto("/dashboard/forms/new");
  await page.getByLabel("Name").first().fill("Library card");
  await page.getByRole("button", { name: "Add field" }).click();
  await page.getByPlaceholder("Search the catalogue…").fill("given_name");
  await page.getByRole("option").first().click();
  await expect(page.getByText("No fields yet")).toBeHidden();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/forms(\/[0-9a-f-]{36})?$/);
  await page.goto("/dashboard/forms");
  await expect(page.getByText("Library card")).toBeVisible();
});

test("the applications inbox lists what holders sent", async ({ page }) => {
  await page.goto("/dashboard/applications");
  const row = page.getByRole("link", { name: /Nova Academic Office/ }).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(/\/dashboard\/applications\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Amina").first()).toBeVisible();
});

test("the account's settings are saved", async ({ page }) => {
  await page.goto("/dashboard/tenant");
  const name = page.getByLabel("Name");
  await expect(name).toHaveValue("Nova University");
  await name.fill("Nova University (e2e)");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.").first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Name")).toHaveValue("Nova University (e2e)");
  await page.getByLabel("Name").fill("Nova University");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.").first()).toBeVisible();
});

test("a wallet's QR announces the wait, not the countdown", async ({
  page,
}) => {
  await page.goto("/dashboard/account/almena");
  const status = page.getByRole("status");
  await expect(status).toHaveText("Waiting for your wallet…");
  // The countdown ticks beside it, outside the live region.
  await expect(page.getByText(/The code expires in \d+:\d\d\./)).toBeVisible();
  await expect(status).not.toContainText("expires");
  const open = page.getByRole("link", { name: "Open in the wallet" });
  await expect(open).toHaveAttribute("href", /^(almena|https):/);
});

test("every page carries its security headers", async ({ request }) => {
  const response = await request.get("/dashboard");
  const policy = response.headers()["content-security-policy"] ?? "";
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(response.headers()["permissions-policy"]).toContain("camera=()");
});
