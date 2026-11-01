import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { fetchActivity } = await import("./activity");
const { activitySpan, activityTotals, hasActivity } =
  await import("./activity-days");

beforeEach(() => api.mockReset());

const day = (date: string, values: Partial<Record<string, number>> = {}) => ({
  date,
  submitted: 0,
  accepted: 0,
  rejected: 0,
  issued: 0,
  verified: 0,
  failed: 0,
  ...values,
});
const quiet = {
  days: [day("2026-10-31"), day("2026-11-01")],
  applications: { submitted: 0, accepted: 0, rejected: 0, issued: 0 },
  credentials: { valid: 0, suspended: 0, revoked: 0 },
  verifications: { verified: 0, failed: 0 },
};

describe("the activity span", () => {
  it("takes the spans offered", () => {
    expect(activitySpan("7")).toBe(7);
    expect(activitySpan(["90", "7"])).toBe(90);
  });

  it("falls back to thirty days", () => {
    expect(activitySpan(undefined)).toBe(30);
    expect(activitySpan("12")).toBe(30);
    expect(activitySpan("ninety")).toBe(30);
  });
});

describe("the activity", () => {
  it("asks the tenant's for the span", async () => {
    api.mockResolvedValue({ status: 200, data: quiet, detail: null });
    expect(await fetchActivity(7)).toEqual(quiet);
    expect(api).toHaveBeenCalledWith("/tenants/t1/activity?days=7", {
      token: "the-session",
    });
  });

  it("says none when nothing happened", () => {
    expect(hasActivity(quiet)).toBe(false);
    expect(
      hasActivity({ ...quiet, days: [day("2026-11-01", { failed: 1 })] }),
    ).toBe(true);
    expect(
      hasActivity({
        ...quiet,
        credentials: { valid: 0, suspended: 0, revoked: 2 },
      }),
    ).toBe(true);
  });

  it("adds the days up", () => {
    expect(
      activityTotals([
        day("a", { submitted: 2, issued: 1 }),
        day("b", { submitted: 1, verified: 4 }),
      ]),
    ).toEqual({
      submitted: 3,
      accepted: 0,
      rejected: 0,
      issued: 1,
      verified: 4,
      failed: 0,
    });
  });
});
