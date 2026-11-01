import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "root", anchor: true }),
}));

const { createCategory, updateCategory } = await import("./category-actions");

beforeEach(() => api.mockReset());

const labels = { en: "Travel", es: "Viajes" };

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("a category's icon", () => {
  it("is sent with a new category", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createCategory(
        {},
        form({
          kind: "credential",
          key: "travel",
          labels: JSON.stringify(labels),
          icon: "plane",
        }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/categories/credentials"));
    expect(api).toHaveBeenCalledWith("/tenants/root/categories", {
      method: "POST",
      body: { kind: "credential", key: "travel", labels, icon: "plane" },
      token: "the-session",
    });
  });

  it("is changed with its name", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await expect(
      updateCategory(
        "c1",
        { kind: "field", key: "travel", labels, icon: "tag" },
        form({ labels: JSON.stringify(labels), icon: "globe" }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/categories/fields"));
    expect(api).toHaveBeenCalledWith("/tenants/root/categories/c1", {
      method: "PATCH",
      body: { labels, icon: "globe" },
      token: "the-session",
    });
  });

  it("is never one the API does not draw", async () => {
    const state = await createCategory(
      {},
      form({
        kind: "field",
        key: "travel",
        labels: JSON.stringify(labels),
        icon: "dragon",
      }),
    );
    expect(state.error).toBe("iconInvalid");
    expect(api).not.toHaveBeenCalled();
  });

  it("words the API's refusal", async () => {
    api.mockResolvedValue({ status: 422, data: null, detail: "icon_invalid" });
    const state = await updateCategory(
      "c1",
      { kind: "field", key: "travel", labels, icon: "tag" },
      form({ labels: JSON.stringify(labels), icon: "plane" }),
    );
    expect(state).toMatchObject({ icon: "plane", error: "iconInvalid" });
  });
});
