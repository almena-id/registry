import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { checkVerification, openVerification } =
  await import("./verification-actions");

beforeEach(() => api.mockReset());

const opened = {
  id: "r1",
  status: "pending",
  expires_at: "2026-11-01T10:05:00Z",
  deep_link: "openid4vp://?request_uri=https%3A%2F%2Falmena.id%2Fr1",
  result: null,
};

describe("asking a wallet by QR", () => {
  it("opens a verifier's request for a form, drawn as a QR code", async () => {
    api.mockResolvedValue({ status: 201, data: opened, detail: null });
    const result = await openVerification("v/1", "f1");
    expect(api).toHaveBeenCalledWith(
      "/tenants/t1/verifiers/v%2F1/verifications",
      {
        method: "POST",
        body: { form_id: "f1" },
        token: "the-session",
      },
    );
    expect(result).toMatchObject({
      ok: true,
      id: "r1",
      deepLink: opened.deep_link,
      expiresAt: opened.expires_at,
    });
    expect(result.ok && result.qr).toMatch(/^<svg/);
  });

  it.each([
    ["verifier_unpublished", 409, "unpublished"],
    ["nothing_to_present", 422, "nothingToPresent"],
    ["form_not_found", 404, "unavailable"],
    [null, null, "unavailable"],
  ])("words %s", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await openVerification("v1", "f1")).toEqual({ ok: false, error });
  });

  it("is unavailable when the API sends no link", async () => {
    api.mockResolvedValue({
      status: 201,
      data: { ...opened, deep_link: null },
      detail: null,
    });
    expect(await openVerification("v1", "f1")).toEqual({
      ok: false,
      error: "unavailable",
    });
  });

  it("tells where a request stands", async () => {
    const result = { verified: true, credentials: [] };
    api.mockResolvedValue({
      status: 200,
      data: { ...opened, status: "answered", result },
      detail: null,
    });
    expect(await checkVerification("v1", "r/1")).toEqual({
      status: "answered",
      result,
    });
    expect(api).toHaveBeenCalledWith(
      "/tenants/t1/verifiers/v1/verifications/r%2F1",
      { token: "the-session" },
    );
  });

  it("is null when the API cannot be reached", async () => {
    api.mockResolvedValue({ status: null, data: null, detail: null });
    expect(await checkVerification("v1", "r1")).toBeNull();
  });
});
