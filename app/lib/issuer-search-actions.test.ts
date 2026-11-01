import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({ api: (...args: unknown[]) => api(...args) }));
const tenant = vi.fn();
vi.mock("./tenant", () => ({ fetchTenant: () => tenant() }));

const { searchIssuers } = await import("./issuer-search-actions");

beforeEach(() => {
  api.mockReset();
  tenant.mockReset();
});

const page = {
  items: [{ did: "did:web:a", name: "A", extra: true }],
  next_cursor: "c2",
};

describe("searching the issuers that grant a type", () => {
  it("asks the public catalogue a page at a time", async () => {
    api.mockResolvedValue({ status: 200, data: page, detail: null });
    expect(await searchIssuers("pid", "  town hall ", "c1")).toEqual({
      items: [{ did: "did:web:a", name: "A" }],
      next_cursor: "c2",
    });
    expect(api).toHaveBeenCalledWith(
      "/catalog/issuers?grants=pid&limit=20&q=town+hall&cursor=c1",
    );
  });

  it("sends no text when none is written, and cuts a long one", async () => {
    api.mockResolvedValue({ status: 200, data: page, detail: null });
    await searchIssuers("pid", "   ");
    expect(api.mock.calls[0][0]).toBe("/catalog/issuers?grants=pid&limit=20");
    await searchIssuers("pid", "x".repeat(150));
    expect(api.mock.calls[1][0]).toContain(`q=${"x".repeat(100)}`);
    expect(api.mock.calls[1][0]).not.toContain("x".repeat(101));
  });

  it("asks only the tenant's issuers for its own type", async () => {
    tenant.mockResolvedValue({ identity: { did: "did:web:t" } });
    api.mockResolvedValue({ status: 200, data: page, detail: null });
    await searchIssuers("custom:member", "");
    expect(api.mock.calls[0][0]).toBe(
      "/catalog/issuers?grants=custom%3Amember&limit=20&tenant=did%3Aweb%3At",
    );
  });

  it("finds nobody for its own type while the tenant has no DID", async () => {
    tenant.mockResolvedValue({ identity: null });
    expect(await searchIssuers("custom:member", "")).toEqual({
      items: [],
      next_cursor: null,
    });
    expect(api).not.toHaveBeenCalled();
  });

  it("is null when the API cannot be reached", async () => {
    api.mockResolvedValue({ status: null, data: null, detail: null });
    expect(await searchIssuers("pid", "")).toBeNull();
  });
});
