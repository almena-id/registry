import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { decideApplication, saveIssuance } =
  await import("./application-actions");

beforeEach(() => api.mockReset());

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("deciding an application", () => {
  it("sends the decision and its note", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    expect(
      await decideApplication(
        "a/1",
        {},
        form({ decision: "reject", note: " Expired " }),
      ),
    ).toEqual({});
    expect(api).toHaveBeenCalledWith(
      "/tenants/t1/applications/a%2F1/decision",
      {
        method: "POST",
        token: "the-session",
        body: { decision: "reject", note: "Expired" },
      },
    );
  });

  it("sends no note when none is written", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await decideApplication("a1", {}, form({ decision: "accept" }));
    expect(api.mock.calls[0][1].body).toEqual({
      decision: "accept",
      note: null,
    });
  });

  it.each([
    ["already_decided", 409, "already_decided"],
    ["application_not_found", 404, "unavailable"],
    [null, null, "unavailable"],
  ])("words %s", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(
      await decideApplication("a1", {}, form({ decision: "accept" })),
    ).toEqual({ error });
  });
});

describe("settling an application's credential", () => {
  it("sends the claims and goes to sign it", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await expect(
      saveIssuance("a1", { given_name: "Ana" }, "2027-01-01"),
    ).rejects.toEqual(new Redirected("/dashboard/applications/a1/issue"));
    expect(api).toHaveBeenCalledWith("/tenants/t1/applications/a1/issuance", {
      method: "PUT",
      token: "the-session",
      body: { claims: { given_name: "Ana" }, valid_until: "2027-01-01" },
    });
  });

  it("hands back the claims the API refused", async () => {
    api.mockResolvedValue({
      status: 422,
      data: null,
      detail: null,
      failure: { errors: { given_name: "required" } },
    });
    expect(await saveIssuance("a1", {}, "2027-01-01")).toEqual({
      ok: false,
      errors: { given_name: "required" },
      error: "claims_invalid",
    });
  });

  it("hands back the API's code", async () => {
    api.mockResolvedValue({
      status: 409,
      data: null,
      detail: "not_accepted",
      failure: { detail: "not_accepted" },
    });
    expect(await saveIssuance("a1", {}, "2027-01-01")).toEqual({
      ok: false,
      errors: {},
      error: "not_accepted",
    });
  });

  it("is unavailable when the API cannot be reached", async () => {
    api.mockResolvedValue({ status: null, data: null, detail: null });
    expect(await saveIssuance("a1", {}, "2027-01-01")).toEqual({
      ok: false,
      errors: {},
      error: "unavailable",
    });
  });
});
