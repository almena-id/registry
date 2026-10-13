import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { publishNow } = await import("./publish-actions");

beforeEach(() => api.mockReset());

describe("publishing when the platform signs", () => {
  it("publishes, and goes back to the item", async () => {
    api.mockResolvedValue({ status: 200, data: { status: "signed" }, detail: null });
    await expect(publishNow("issuers", "i1")).rejects.toEqual(
      new Redirected("/dashboard/issuers/i1?signed=1"),
    );
    expect(api).toHaveBeenCalledWith("/tenants/t1/issuers/i1/publish", {
      method: "POST",
      body: { locale: "en" },
      token: "the-session",
    });
  });

  it.each([
    ["tenant_outdated", 409],
    ["not_a_signer", 403],
    [null, null],
  ])("says why not: %s", async (detail, status) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await publishNow("mediators", "m1")).toEqual({ error: detail });
  });

  it("does not take a wallet request for done", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { id: "r1", deep_link: "almena://", poll: "p" },
      detail: null,
    });
    expect(await publishNow("verifiers", "v1")).toEqual({ error: null });
  });
});
