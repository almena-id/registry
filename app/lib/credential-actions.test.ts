import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { saveIssuerCredentialTypes } = await import("./credential-actions");

beforeEach(() => api.mockReset());

function form(): FormData {
  const data = new FormData();
  data.append("types", "pid");
  data.append("types", "custom:member");
  data.set("form.pid", "f1");
  data.set("form.custom:member", "");
  data.set("form.unticked", "f2");
  return data;
}

describe("declaring the credential types an issuer grants", () => {
  it("sends the ticked types and the forms of those that have one", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    expect(await saveIssuerCredentialTypes("i1", {}, form())).toEqual({
      saved: true,
    });
    expect(api).toHaveBeenCalledWith(
      "/tenants/t1/issuers/i1/credential-types",
      {
        method: "PUT",
        token: "the-session",
        body: { types: ["pid", "custom:member"], forms: { pid: "f1" } },
      },
    );
  });

  it.each([
    ["credential_type_invalid", 422, "invalid"],
    ["request_form_invalid", 422, "formInvalid"],
    ["issuer_not_found", 404, "unavailable"],
    [null, null, "unavailable"],
  ])("words %s", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await saveIssuerCredentialTypes("i1", {}, form())).toEqual({
      error,
    });
  });
});
