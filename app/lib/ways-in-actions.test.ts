import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  tenantCookie: "almena.tenant",
  api: (...args: unknown[]) => api(...args),
}));
const kept = vi.hoisted(() => ({
  move: undefined as string | undefined,
  deleted: [] as string[],
  session: vi.fn(),
  ticket: vi.fn(),
}));
vi.mock("./session", () => ({
  moveCookie: "almena.move",
  noMove: "none",
  keepSession: kept.session,
  keepMove: kept.ticket,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "almena.session"
        ? { value: "the-session" }
        : name === "almena.move" && kept.move
          ? { value: kept.move }
          : undefined,
    delete: (name: string) => kept.deleted.push(name),
  }),
}));

const { linkEmail, moveAccount, unlink } = await import("./ways-in-actions");

beforeEach(() => {
  api.mockReset();
  kept.move = undefined;
  kept.deleted = [];
  kept.session.mockReset();
  kept.ticket.mockReset();
});

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("linking an email", () => {
  it("goes back to the address to change it", async () => {
    expect(
      await linkEmail(
        { step: "code", email: "a@b.co" },
        form({ intent: "change" }),
      ),
    ).toEqual({ step: "email", email: "a@b.co" });
  });

  it("checks the address before calling the API", async () => {
    const state = await linkEmail(
      { step: "email" },
      form({ intent: "send", email: "nope" }),
    );
    expect(state.errors).toEqual({ email: "emailInvalid" });
    expect(api).not.toHaveBeenCalled();
  });

  it("sends a code in the visitor's language", async () => {
    api.mockResolvedValue({ status: 202, data: null, detail: null });
    expect(
      await linkEmail(
        { step: "code", email: "ada@acme.com" },
        form({ intent: "resend" }),
      ),
    ).toEqual({ step: "code", email: "ada@acme.com", resent: true });
    expect(api).toHaveBeenCalledWith("/auth/code", {
      method: "POST",
      body: { email: "ada@acme.com", locale: "en" },
    });
  });

  it.each([
    ["too_many_codes", 429, "email", { code: "tooManyCodes" }],
    ["too_many_requests", 429, "email", { form: "tooManyRequests" }],
    ["mail_unavailable", 503, "email", { form: "mailUnavailable" }],
    [null, 422, "email", { email: "emailInvalid" }],
    [null, null, "email", { form: "unavailable" }],
  ])("words %s when sending", async (detail, status, step, errors) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(
      await linkEmail(
        { step: "email" },
        form({ intent: "send", email: "ada@acme.com" }),
      ),
    ).toEqual({ step, email: "ada@acme.com", errors });
  });

  it("checks the code's shape before calling the API", async () => {
    const state = await linkEmail(
      { step: "code", email: "ada@acme.com" },
      form({ code: "12a" }),
    );
    expect(state.errors).toEqual({ code: "codeFormat" });
    expect(api).not.toHaveBeenCalled();
  });

  it("links it with the code", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { status: "linked", move_ticket: null },
      detail: null,
    });
    await expect(
      linkEmail(
        { step: "code", email: "ada@acme.com" },
        form({ code: "123 456" }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/account?linked=1"));
    expect(api).toHaveBeenCalledWith("/auth/me/email", {
      method: "POST",
      body: { email: "ada@acme.com", code: "123456" },
      token: "the-session",
    });
  });

  it("keeps the ticket when the address is another account's", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { status: "taken", move_ticket: "m1" },
      detail: null,
    });
    await expect(
      linkEmail(
        { step: "code", email: "ada@acme.com" },
        form({ code: "123456" }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/account/taken"));
    expect(kept.ticket).toHaveBeenCalledWith("m1");
  });

  it.each([
    ["invalid_code", { code: "invalidCode" }],
    ["too_many_attempts", { code: "tooManyAttempts" }],
  ])("words %s when linking", async (detail, errors) => {
    api.mockResolvedValue({ status: 400, data: null, detail });
    expect(
      await linkEmail(
        { step: "code", email: "ada@acme.com" },
        form({ code: "123456" }),
      ),
    ).toEqual({ step: "code", email: "ada@acme.com", errors });
  });
});

describe("unlinking a way in", () => {
  it("unlinks the email or a provider account", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await expect(unlink("")).rejects.toEqual(
      new Redirected("/dashboard/account"),
    );
    expect(api).toHaveBeenCalledWith("/auth/me/email", {
      method: "DELETE",
      token: "the-session",
    });
    await expect(unlink("p1")).rejects.toEqual(
      new Redirected("/dashboard/account"),
    );
    expect(api.mock.calls[1][0]).toBe("/auth/me/accounts/p1");
  });

  it("keeps the id inside its path segment", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await expect(unlink("../email?x=1")).rejects.toEqual(
      new Redirected("/dashboard/account"),
    );
    expect(api.mock.calls[0][0]).toBe("/auth/me/accounts/..%2Femail%3Fx%3D1");
  });

  it("says why it was refused", async () => {
    api.mockResolvedValue({ status: 409, data: null, detail: "last_way_in" });
    await expect(unlink("p1")).rejects.toEqual(
      new Redirected("/dashboard/account?error=last_way_in"),
    );
    api.mockResolvedValue({ status: null, data: null, detail: null });
    await expect(unlink("p1")).rejects.toEqual(
      new Redirected("/dashboard/account?error=unavailable"),
    );
  });
});

describe("moving to the account that owns the way in", () => {
  it("does nothing without a ticket", async () => {
    kept.move = "none";
    await expect(moveAccount()).rejects.toEqual(
      new Redirected("/dashboard/account"),
    );
    expect(api).not.toHaveBeenCalled();
  });

  it("signs in there and forgets the tenant chosen", async () => {
    kept.move = "m1";
    const signedIn = { token: "s2", expires_at: "", user: {} };
    api.mockResolvedValue({ status: 200, data: signedIn, detail: null });
    await expect(moveAccount()).rejects.toEqual(
      new Redirected("/dashboard/account?moved=1"),
    );
    expect(api).toHaveBeenCalledWith("/auth/me/move", {
      method: "POST",
      body: { ticket: "m1" },
      token: "the-session",
    });
    expect(kept.session).toHaveBeenCalledWith(signedIn);
    expect(kept.deleted).toEqual(["almena.move", "almena.tenant"]);
  });

  it("says why it was refused", async () => {
    kept.move = "m1";
    api.mockResolvedValue({
      status: 410,
      data: null,
      detail: "ticket_expired",
    });
    await expect(moveAccount()).rejects.toEqual(
      new Redirected("/dashboard/account?error=ticket_expired"),
    );
    expect(kept.deleted).toEqual(["almena.move"]);
  });
});
