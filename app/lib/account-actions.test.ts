import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
}));

const { saveAccount } = await import("./account-actions");

beforeEach(() => api.mockReset());

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("saving the account", () => {
  it("sends the alias, trimmed", async () => {
    api.mockResolvedValue({ status: 200, data: { alias: "Ana" } });
    expect(await saveAccount({}, form({ alias: "  Ana " }))).toEqual({
      alias: "Ana",
      saved: true,
    });
    expect(api).toHaveBeenCalledWith("/auth/me", {
      method: "PATCH",
      body: { alias: "Ana" },
      token: "the-session",
    });
  });

  it("clears an empty alias", async () => {
    api.mockResolvedValue({ status: 200, data: { alias: null } });
    expect(await saveAccount({}, form({ alias: "" }))).toEqual({
      alias: "",
      saved: true,
    });
    expect(api.mock.calls[0][1].body).toEqual({ alias: null });
  });

  it("refuses a long alias before calling the API", async () => {
    const state = await saveAccount({}, form({ alias: "a".repeat(101) }));
    expect(state.errors).toEqual({ alias: "aliasLong" });
    expect(api).not.toHaveBeenCalled();
  });

  it("words the API's refusal", async () => {
    api.mockResolvedValue({ status: 422, data: null, detail: "x" });
    expect(await saveAccount({}, form({ alias: "Ana" }))).toEqual({
      alias: "Ana",
      errors: { form: "unavailable" },
    });
  });
});
