import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  tenantCookie: "almena.tenant",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { changeRole, leave, removeMember, withdrawInvitation } = await import(
  "./member-actions"
);

beforeEach(() => api.mockReset());

describe("managing the people in an account", () => {
  it("changes a role", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    expect(await changeRole("u2", "admin")).toEqual({});
    expect(api).toHaveBeenCalledWith("/tenants/t1/members/u2", {
      method: "PATCH",
      body: { role: "admin" },
      token: "the-session",
    });
  });

  it.each([
    ["last_admin", 409, "lastAdmin"],
    ["member_signs", 409, "memberSigns"],
    ["not_admin", 403, "notAdmin"],
    ["member_not_found", 404, "gone"],
    [null, null, "unavailable"],
  ])("words %s", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await removeMember("u2")).toEqual({ error });
  });

  it("takes an invitation back", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    expect(await withdrawInvitation("i1")).toEqual({});
    expect(api.mock.calls[0][0]).toBe("/tenants/t1/invitations/i1");
  });

  it("leaves, and opens the dashboard in another account", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await expect(leave("u1")).rejects.toEqual(new Redirected("/dashboard"));
  });
});
