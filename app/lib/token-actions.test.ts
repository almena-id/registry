import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
}));

const { createToken, revokeToken } = await import("./token-actions");

beforeEach(() => api.mockReset());

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("API tokens", () => {
  it("are made, and the secret comes back this once", async () => {
    api.mockResolvedValue({
      status: 201,
      data: { name: "CI", token: "secret" },
      detail: null,
    });
    expect(await createToken({}, form({ name: " CI ", days: "30" }))).toEqual({
      secret: "secret",
      made: "CI",
    });
    expect(api).toHaveBeenCalledWith("/auth/me/tokens", {
      method: "POST",
      body: { name: "CI", expires_in_days: 30 },
      token: "the-session",
    });
  });

  it("last 90 days unless told otherwise", async () => {
    api.mockResolvedValue({ status: 201, data: { name: "CI", token: "s" } });
    await createToken({}, form({ name: "CI" }));
    expect(api.mock.calls[0][1].body.expires_in_days).toBe(90);
  });

  it.each([
    [{ name: "", days: "30" }, { name: "nameRequired" }],
    [{ name: "x".repeat(101), days: "30" }, { name: "nameLong" }],
    [{ name: "CI", days: "0" }, { days: "daysInvalid" }],
    [{ name: "CI", days: "366" }, { days: "daysInvalid" }],
    [{ name: "CI", days: "1.5" }, { days: "daysInvalid" }],
    [
      { name: "", days: "x" },
      { name: "nameRequired", days: "daysInvalid" },
    ],
  ])("refuse %o before calling the API", async (values, errors) => {
    expect((await createToken({}, form(values))).errors).toEqual(errors);
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["name_required", 422, { name: "nameRequired" }],
    ["too_many_tokens", 409, { form: "tooMany" }],
    [null, null, { form: "unavailable" }],
  ])("word %s", async (detail, status, errors) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await createToken({}, form({ name: "CI", days: "30" }))).toEqual({
      name: "CI",
      days: "30",
      errors,
    });
  });

  it("are revoked", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await revokeToken("k/1");
    expect(api).toHaveBeenCalledWith("/auth/me/tokens/k%2F1", {
      method: "DELETE",
      token: "the-session",
    });
  });
});
