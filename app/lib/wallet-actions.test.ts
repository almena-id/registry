import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));
const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  session: vi.fn(),
  ticket: vi.fn(),
}));
vi.mock("./session", () => ({
  keepSession: jar.session,
  keepMove: jar.ticket,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.values.has(name) ? { value: jar.values.get(name) } : undefined,
    set: (name: string, value: string) => jar.values.set(name, value),
    delete: (name: string) => jar.values.delete(name),
  }),
}));

const { pollWallet, startWallet } = await import("./wallet-actions");

const created = {
  id: "w1",
  deep_link: "openid4vp://?request_uri=x",
  poll: "secret",
  expires_at: "2026-11-01T10:05:00Z",
};

beforeEach(() => {
  api.mockReset();
  jar.values = new Map([["almena.session", "the-session"]]);
  jar.session.mockReset();
  jar.ticket.mockReset();
});

const kept = () => JSON.parse(jar.values.get("almena.wallet") ?? "null");

describe("starting a wallet request", () => {
  it("signs in with no session sent, and keeps the poll secret", async () => {
    api.mockResolvedValue({ status: 201, data: created, detail: null });
    const start = await startWallet("sign_in");
    expect(api).toHaveBeenCalledWith("/auth/wallet/requests", {
      method: "POST",
      body: { purpose: "sign_in", locale: "en" },
      token: undefined,
    });
    expect(start).toMatchObject({
      ok: true,
      deepLink: created.deep_link,
      expiresAt: created.expires_at,
    });
    expect(start.ok && start.qr).toMatch(/^<svg/);
    expect(kept()).toEqual({ purpose: "sign_in", id: "w1", poll: "secret" });
  });

  it("links with the session", async () => {
    api.mockResolvedValue({ status: 201, data: created, detail: null });
    await startWallet("link");
    expect(api.mock.calls[0][1].token).toBe("the-session");
  });

  it.each([
    [{ kind: "identity", id: "i/1" }, "/tenants/t1/identities/i%2F1/sign", {}],
    [
      { kind: "credential", id: "a1" },
      "/tenants/t1/applications/a1/issuance/sign",
      {},
    ],
    [
      { kind: "status_list", issuer: "s1" },
      "/tenants/t1/issuers/s1/status-lists/sign",
      {},
    ],
    [
      { kind: "status_list", issuer: "s1", list: "l1" },
      "/tenants/t1/issuers/s1/status-lists/sign",
      { status_list_id: "l1" },
    ],
    [
      { kind: "credential_status", id: "a1", status: "revoked" },
      "/tenants/t1/applications/a1/credential-status",
      { status: "revoked" },
    ],
  ])("signs %o", async (target, path, extra) => {
    api.mockResolvedValue({ status: 201, data: created, detail: null });
    await startWallet("sign", {
      ...target,
      back: "/dashboard/issuers/s1",
    } as never);
    expect(api).toHaveBeenCalledWith(path, {
      method: "POST",
      body: { locale: "en", ...extra },
      token: "the-session",
    });
    expect(kept().back).toBe("/dashboard/issuers/s1");
  });

  it("keeps only one of the dashboard's own paths to go back to", async () => {
    api.mockResolvedValue({ status: 201, data: created, detail: null });
    await startWallet("sign", {
      kind: "identity",
      id: "i1",
      back: "https://evil.example/",
    });
    expect(kept().back).toBe("/dashboard");
  });

  it("asks nothing to sign without a target", async () => {
    expect(await startWallet("sign")).toEqual({ ok: false, error: null });
    expect(api).not.toHaveBeenCalled();
  });

  it("hands back the API's code", async () => {
    api.mockResolvedValue({ status: 409, data: null, detail: "not_signer" });
    expect(await startWallet("sign_in")).toEqual({
      ok: false,
      error: "not_signer",
    });
    expect(kept()).toBeNull();
  });
});

describe("waiting for the wallet", () => {
  function keep(purpose: string, back?: string) {
    jar.values.set(
      "almena.wallet",
      JSON.stringify({ purpose, id: "w1", poll: "secret", back }),
    );
  }

  it("is expired with nothing kept", async () => {
    expect(await pollWallet()).toEqual({ status: "expired" });
    expect(api).not.toHaveBeenCalled();
  });

  it("asks with the poll secret, and keeps waiting", async () => {
    keep("link");
    api.mockResolvedValue({ status: 200, data: { status: "pending" } });
    expect(await pollWallet()).toEqual({ status: "pending" });
    expect(api).toHaveBeenCalledWith("/auth/wallet/requests/w1/result", {
      method: "POST",
      body: { poll: "secret" },
      token: "the-session",
    });
    expect(kept()).not.toBeNull();
  });

  it.each([404, 410])("is expired when the API answers %s", async (status) => {
    keep("sign_in");
    api.mockResolvedValue({ status, data: null, detail: null });
    expect(await pollWallet()).toEqual({ status: "expired" });
    expect(api.mock.calls[0][1].token).toBeUndefined();
    expect(kept()).toBeNull();
  });

  it("fails when the API cannot be reached", async () => {
    keep("sign_in");
    api.mockResolvedValue({ status: null, data: null, detail: null });
    expect(await pollWallet()).toEqual({ status: "failed" });
  });

  it("signs in", async () => {
    keep("sign_in");
    const session = { token: "s2", expires_at: "", user: {} };
    api.mockResolvedValue({
      status: 200,
      data: { status: "signed_in", session },
    });
    expect(await pollWallet()).toEqual({ status: "done", to: "/dashboard" });
    expect(jar.session).toHaveBeenCalledWith(session);
    expect(kept()).toBeNull();
  });

  it("goes back once signed", async () => {
    keep("sign", "/dashboard/issuers/s1");
    api.mockResolvedValue({ status: 200, data: { status: "signed" } });
    expect(await pollWallet()).toEqual({
      status: "done",
      to: "/dashboard/issuers/s1?signed=1",
    });
  });

  it("links, or keeps the ticket when it is another account's", async () => {
    keep("link");
    api.mockResolvedValue({ status: 200, data: { status: "linked" } });
    expect(await pollWallet()).toEqual({
      status: "done",
      to: "/dashboard/account?linked=1",
    });
    keep("link");
    api.mockResolvedValue({
      status: 200,
      data: { status: "taken", move_ticket: "m1" },
    });
    expect(await pollWallet()).toEqual({
      status: "done",
      to: "/dashboard/account/taken",
    });
    expect(jar.ticket).toHaveBeenCalledWith("m1");
  });
});
