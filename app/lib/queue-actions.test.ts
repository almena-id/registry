import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1" }),
}));

const { createQueue, deleteQueue } = await import("./queue-actions");

beforeEach(() => api.mockReset());

const queue = {
  queue: "subject.town-hall",
  created_at: "2026-10-03T00:00:00Z",
} as never;

describe("an issuer's or verifier's queue", () => {
  it("is made, and its password comes back this once", async () => {
    api.mockResolvedValue({
      status: 201,
      data: { ...(queue as object), password: "pw" },
      detail: null,
    });
    expect(await createQueue("issuers", "i1", {})).toEqual({
      queue,
      password: "pw",
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1/issuers/i1/queue", {
      method: "POST",
      token: "the-session",
    });
  });

  it("is deleted, and the screen shows it gone", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    expect(await deleteQueue("verifiers", "v1", { queue })).toEqual({
      queue: { queue: null, created_at: null },
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1/verifiers/v1/queue", {
      method: "DELETE",
      token: "the-session",
    });
  });

  it.each([
    ["broker_unavailable", 503, "brokerUnavailable"],
    ["queue_exists", 409, "exists"],
    ["queue_not_found", 404, "missing"],
    ["other", 400, "unavailable"],
    [null, null, "unavailable"],
  ])("words %s, keeping the queue shown", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await createQueue("issuers", "i1", { queue })).toEqual({
      queue,
      error,
    });
    expect(await deleteQueue("issuers", "i1", { queue })).toEqual({
      queue,
      error,
    });
  });
});
