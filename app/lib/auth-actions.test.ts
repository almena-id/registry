import { beforeEach, describe, expect, it, vi } from "vitest";


const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
}));
vi.mock("./session", () => ({ keepSession: async () => {} }));

const { authenticate } = await import("./auth-actions");

function send(email: string): FormData {
  const data = new FormData();
  data.set("intent", "send");
  data.set("email", email);
  return data;
}

beforeEach(() => api.mockReset());

describe("asking for a sign-in code", () => {
  it("checks the address before calling the API", async () => {
    const state = await authenticate({ step: "email" }, send("nope"));
    expect(state.errors).toEqual({ email: "emailInvalid" });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["too_many_codes", { code: "tooManyCodes" }],
    ["too_many_attempts", { code: "tooManyAttempts" }],
    ["too_many_requests", { form: "tooManyRequests" }],
    ["mail_unavailable", { form: "mailUnavailable" }],
  ])("words %s", async (detail, errors) => {
    api.mockResolvedValue({ status: 429, data: null, detail });
    const state = await authenticate({ step: "email" }, send("ada@acme.com"));
    expect(state.errors).toEqual(errors);
  });

  it("moves on to the code once it is sent", async () => {
    api.mockResolvedValue({ status: 202, data: null, detail: null });
    const state = await authenticate({ step: "email" }, send("ada@acme.com"));
    expect(state).toEqual({ step: "code", email: "ada@acme.com", resent: false });
  });
});
