import { beforeEach, describe, expect, it, vi } from "vitest";

const set = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ set }) }));

const { setLocale, setTheme } = await import("./preferences");

beforeEach(() => set.mockReset());

const kept = { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" };

describe("the visitor's preferences", () => {
  it("keep a language the portal speaks, for a year", async () => {
    await setLocale("es");
    expect(set).toHaveBeenCalledWith("almena.locale", "es", kept);
  });

  it("keep a theme the portal draws", async () => {
    await setTheme("dark");
    expect(set).toHaveBeenCalledWith("almena.theme", "dark", kept);
  });

  it("keep nothing else", async () => {
    await setLocale("xx");
    await setTheme("neon");
    expect(set).not.toHaveBeenCalled();
  });
});
