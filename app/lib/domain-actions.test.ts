import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { addDomain, checkDomain, removeDomain } =
  await import("./domain-actions");

beforeEach(() => api.mockReset());

function form(domain: string): FormData {
  const data = new FormData();
  data.set("domain", domain);
  return data;
}

describe("an account's domains", () => {
  it("are added, and the list opens on the new one", async () => {
    api.mockResolvedValue({ status: 201, data: { id: "d1" }, detail: null });
    await expect(addDomain({}, form(" acme.com "))).rejects.toEqual(
      new Redirected("/dashboard/domains?open=d1"),
    );
    expect(api).toHaveBeenCalledWith("/tenants/t1/domains", {
      method: "POST",
      body: { domain: "acme.com" },
      token: "the-session",
    });
  });

  it("are asked for before calling the API", async () => {
    expect(await addDomain({}, form("  "))).toEqual({
      domain: "",
      error: "domainRequired",
    });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["domain_invalid", 422, "domainInvalid"],
    ["domain_exists", 409, "domainExists"],
    ["not_admin", 403, "notAdmin"],
    [null, 403, "notAdmin"],
    [null, 500, "unavailable"],
    [null, null, "unavailable"],
  ])("word %s (%s)", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await addDomain({}, form("acme.com"))).toEqual({
      domain: "acme.com",
      error,
    });
  });

  it("are checked", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    expect(await checkDomain("d/1", false)).toEqual({});
    expect(api).toHaveBeenCalledWith("/tenants/t1/domains/d%2F1/check", {
      method: "POST",
      token: "the-session",
    });
  });

  it.each([
    ["dns_record_not_found", false, "recordNotFound"],
    ["dns_record_not_found", true, "recordGone"],
    ["dns_unavailable", true, "dnsUnavailable"],
  ])("word a check's %s (verified: %s)", async (detail, verified, error) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    expect(await checkDomain("d1", verified)).toEqual({ error });
  });

  it("are removed", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    expect(await removeDomain("d1")).toEqual({});
    expect(api).toHaveBeenCalledWith("/tenants/t1/domains/d1", {
      method: "DELETE",
      token: "the-session",
    });
    api.mockResolvedValue({ status: 403, data: null, detail: "not_admin" });
    expect(await removeDomain("d1")).toEqual({ error: "notAdmin" });
  });
});
