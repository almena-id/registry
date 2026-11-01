import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
const set = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "almena.session" ? { value: "the-session" } : undefined,
    set: (...args: unknown[]) => set(...args),
    delete: () => {},
  }),
  headers: async () => new Headers(),
}));
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  tenantCookie: "almena.tenant",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
  currentTenants: async () => [{ id: "t1" }],
}));

const { chooseTenant, saveSigningFlow } = await import("./tenant-actions");

beforeEach(() => api.mockReset());

function form(flow: string): FormData {
  const data = new FormData();
  data.set("signingFlow", flow);
  return data;
}

describe("choosing the signing flow", () => {
  it("chooses any admin", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { signing_flow: "any_admin", signer: null },
      detail: null,
    });
    const state = { signingFlow: "single_user" as const, signer: "u1" };
    expect(await saveSigningFlow(state, form("any_admin"))).toEqual({
      signingFlow: "any_admin",
      signer: "",
      saved: true,
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1", {
      method: "PATCH",
      body: { signing_flow: "any_admin" },
      token: "the-session",
    });
  });

  it("sends no flow the portal does not offer", async () => {
    const state = { signingFlow: "any_admin" as const, signer: "" };
    expect(await saveSigningFlow(state, form("none"))).toEqual(state);
    expect(api).not.toHaveBeenCalled();
  });
});

describe("choosing the tenant", () => {
  it("keeps it in an HTTP-only cookie, secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    set.mockReset();
    await expect(chooseTenant("t1")).rejects.toEqual(
      new Redirected("/dashboard"),
    );
    expect(set).toHaveBeenCalledWith(
      "almena.tenant",
      "t1",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      }),
    );
    vi.unstubAllEnvs();
  });

  it("ignores a tenant that is not the account's", async () => {
    set.mockReset();
    await chooseTenant("t2");
    expect(set).not.toHaveBeenCalled();
  });
});
