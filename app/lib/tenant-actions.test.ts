import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  tenantCookie: "almena.tenant",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
  currentTenants: async () => [{ id: "t1" }],
}));

const { saveSigningFlow } = await import("./tenant-actions");

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
