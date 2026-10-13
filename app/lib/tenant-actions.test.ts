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
  it("chooses no signature", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { signing_flow: "none", signer: null },
      detail: null,
    });
    const state = { signingFlow: "any_admin" as const, signer: "" };
    expect(await saveSigningFlow(state, form("none"))).toEqual({
      signingFlow: "none",
      signer: "",
      saved: true,
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1", {
      method: "PATCH",
      body: { signing_flow: "none" },
      token: "the-session",
    });
  });

  it("says when the platform cannot make its key", async () => {
    api.mockResolvedValue({ status: 503, data: null, detail: "vault_unavailable" });
    const state = { signingFlow: "any_admin" as const, signer: "" };
    expect(await saveSigningFlow(state, form("none"))).toEqual({
      signingFlow: "none",
      signer: "",
      error: "vaultUnavailable",
    });
  });
});
