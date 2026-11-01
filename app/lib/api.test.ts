import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const seen = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => seen.headers,
}));

const { api } = await import("./api");

const fetched = vi.fn();

beforeEach(() => {
  vi.stubEnv("REGISTRY_PORTAL_SECRET", "the-secret");
  vi.stubGlobal("fetch", fetched);
  fetched.mockReset();
  fetched.mockResolvedValue(new Response(null, { status: 204 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function clientIp(headers: Record<string, string>) {
  seen.headers = new Headers(headers);
  await api("/auth/me");
  return fetched.mock.calls[0][1].headers["X-Almena-Client-IP"];
}

describe("the visitor's address sent to the API", () => {
  it("is the entry the proxy added, not one the client wrote", async () => {
    expect(await clientIp({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" })).toBe(
      "203.0.113.7",
    );
  });

  it("is the only entry when there is one", async () => {
    expect(await clientIp({ "x-forwarded-for": "203.0.113.7" })).toBe(
      "203.0.113.7",
    );
  });

  it("falls back to X-Real-IP", async () => {
    expect(await clientIp({ "x-real-ip": "203.0.113.8" })).toBe("203.0.113.8");
  });

  it("is not sent without the portal's secret", async () => {
    vi.stubEnv("REGISTRY_PORTAL_SECRET", "");
    expect(await clientIp({ "x-forwarded-for": "203.0.113.7" })).toBe(
      undefined,
    );
  });
});
