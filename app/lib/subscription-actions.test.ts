import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
const tenant = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: () => tenant(),
}));

const { saveSubscription } = await import("./subscription-actions");

beforeEach(() => {
  api.mockReset();
  tenant.mockResolvedValue({ id: "root", anchor: true });
});

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("setting an account's subscription", () => {
  it("sends it, paid through the end of the day", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    const state = await saveSubscription(
      "a1",
      {},
      form({ status: "active", until: "2027-01-31", note: " Paid " }),
    );
    expect(state).toMatchObject({ saved: true, plan: "standard" });
    expect(api).toHaveBeenCalledWith("/tenants/root/accounts/a1/subscription", {
      method: "PUT",
      token: "the-session",
      body: {
        plan: "standard",
        status: "active",
        current_period_end: "2027-01-31T23:59:59Z",
        note: "Paid",
      },
    });
  });

  it("sends no end and no note when none is given", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await saveSubscription("a1", {}, form({ status: "trialing", plan: "pro" }));
    expect(api.mock.calls[0][1].body).toEqual({
      plan: "pro",
      status: "trialing",
      current_period_end: null,
      note: null,
    });
  });

  it("removes it with no status", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await saveSubscription("a1", {}, form({ status: "" }));
    expect(api).toHaveBeenCalledWith("/tenants/root/accounts/a1/subscription", {
      method: "DELETE",
      token: "the-session",
    });
  });

  it("is only the trust anchor's", async () => {
    tenant.mockResolvedValue({ id: "t1", anchor: false });
    const state = await saveSubscription("a1", {}, form({ status: "active" }));
    expect(state.error).toBe("notAllowed");
    expect(api).not.toHaveBeenCalled();
  });

  it("refuses a day that is not one before calling the API", async () => {
    const state = await saveSubscription(
      "a1",
      {},
      form({ status: "active", until: "31/01/2027" }),
    );
    expect(state).toMatchObject({ until: "31/01/2027", error: "untilInvalid" });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["plan_invalid", 422, "planInvalid"],
    ["period_end_invalid", 422, "untilPast"],
    ["account_not_found", 404, "notFound"],
    ["anchor_only", 403, "notAllowed"],
    ["not_admin", 403, "notAllowed"],
    [null, null, "unavailable"],
  ])("words %s", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    const state = await saveSubscription("a1", {}, form({ status: "active" }));
    expect(state).toMatchObject({ status: "active", error });
  });
});
