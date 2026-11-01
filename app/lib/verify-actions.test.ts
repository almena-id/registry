import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { verifyPresentation } = await import("./verify-actions");

beforeEach(() => api.mockReset());

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const presented = {
  vp_token: ' {"pid": ["eyJ"]} ',
  nonce: " n1 ",
  audience: " x509_san_dns:almena.id ",
};

describe("checking a presentation against a form", () => {
  it("sends the token parsed, with its nonce and audience", async () => {
    const result = { verified: true, credentials: [] };
    api.mockResolvedValue({ status: 200, data: result, detail: null });
    const state = await verifyPresentation("f/1", {}, form(presented));
    expect(state.result).toEqual(result);
    expect(api).toHaveBeenCalledWith("/tenants/t1/forms/f%2F1/verify", {
      method: "POST",
      body: {
        vp_token: { pid: ["eyJ"] },
        nonce: "n1",
        audience: "x509_san_dns:almena.id",
      },
      token: "the-session",
    });
  });

  it("asks for everything before calling the API", async () => {
    const state = await verifyPresentation("f1", {}, form({}));
    expect(state.errors).toEqual({
      vpToken: "vpTokenRequired",
      nonce: "nonceRequired",
      audience: "audienceRequired",
    });
    expect(api).not.toHaveBeenCalled();
  });

  it("refuses a token that is not JSON before calling the API", async () => {
    const state = await verifyPresentation(
      "f1",
      {},
      form({ ...presented, vp_token: "eyJ" }),
    );
    expect(state).toMatchObject({
      vpToken: "eyJ",
      errors: { vpToken: "vpTokenInvalid" },
    });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    [422, { vpToken: "vpTokenInvalid" }],
    [404, { form: "refused" }],
    [null, { form: "unavailable" }],
  ])("words a %s answer", async (status, errors) => {
    api.mockResolvedValue({ status, data: null, detail: null });
    const state = await verifyPresentation("f1", {}, form(presented));
    expect(state.errors).toEqual(errors);
  });
});
