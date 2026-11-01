import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
const tenant = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: () => tenant(),
}));

const { createDomain, deleteDomain, updateDomain } =
  await import("./value-domain-actions");

beforeEach(() => {
  api.mockReset();
  tenant.mockResolvedValue({ id: "root", anchor: true });
});

const labels = { en: "Sex", es: "Sexo" };
const male = { value: " 1 ", labels: { en: "Male", es: "Hombre" } };

function form(values: Record<string, unknown>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values))
    data.set(key, typeof value === "string" ? value : JSON.stringify(value));
  return data;
}

const filled = {
  key: " sex ",
  labels,
  source: " ISO/IEC 5218 ",
  kind: "number",
  codes: [male, { value: "", labels: {} }],
};

describe("a value domain", () => {
  it("is added with its codes, numbers as numbers", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(createDomain({}, form(filled))).rejects.toEqual(
      new Redirected("/dashboard/value-lists"),
    );
    expect(api).toHaveBeenCalledWith("/tenants/root/value-domains", {
      method: "POST",
      body: {
        key: "sex",
        labels,
        source: "ISO/IEC 5218",
        codes: [{ value: 1, labels: male.labels }],
      },
      token: "the-session",
    });
  });

  it("sends a file code's media type", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createDomain(
        {},
        form({
          ...filled,
          kind: "text",
          codes: [{ ...male, value: "photo", media_type: " image/png " }],
        }),
      ),
    ).rejects.toBeInstanceOf(Redirected);
    expect(api.mock.calls[0][1].body.codes).toEqual([
      { value: "photo", labels: male.labels, media_type: "image/png" },
    ]);
  });

  it("is changed, never its key", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await expect(
      updateDomain("d/1", { key: "sex" }, form({ ...filled, key: "other" })),
    ).rejects.toEqual(new Redirected("/dashboard/value-lists"));
    expect(api).toHaveBeenCalledWith("/tenants/root/value-domains/d%2F1", {
      method: "PATCH",
      body: {
        labels,
        source: "ISO/IEC 5218",
        codes: [{ value: 1, labels: male.labels }],
      },
      token: "the-session",
    });
  });

  it.each([
    [{ key: "" }, "keyRequired"],
    [{ labels: { en: "Sex" } }, "labelsRequired"],
    [{ source: " " }, "sourceRequired"],
    [{ codes: [] }, "codesInvalid"],
    [{ codes: "not json" }, "codesInvalid"],
    [{ codes: [{ ...male, value: "one" }] }, "numbersInvalid"],
    [{ codes: [{ ...male, labels: { en: "Male" } }] }, "codesInvalid"],
  ])("refuses %o before calling the API", async (change, error) => {
    const state = await createDomain({}, form({ ...filled, ...change }));
    expect(state.error).toBe(error);
    expect(api).not.toHaveBeenCalled();
  });

  it("is only the trust anchor's", async () => {
    tenant.mockResolvedValue({ id: "t1", anchor: false });
    expect((await createDomain({}, form(filled))).error).toBe("unavailable");
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["key_invalid", "keyInvalid"],
    ["key_exists", "keyExists"],
    ["labels_required", "labelsRequired"],
    ["source_required", "sourceRequired"],
    ["codes_invalid", "codesInvalid"],
    ["media_type_invalid", "mediaTypeInvalid"],
    ["domain_in_use", "inUse"],
    ["domain_not_found", "unavailable"],
    ["anchor_only", "unavailable"],
    [null, "unavailable"],
  ])("words %s", async (detail, error) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    const state = await updateDomain("d1", { key: "sex" }, form(filled));
    expect(state).toMatchObject({ key: "sex", error });
  });

  it("is deleted", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    expect(await deleteDomain("d1")).toEqual({});
    expect(api).toHaveBeenCalledWith("/tenants/root/value-domains/d1", {
      method: "DELETE",
      token: "the-session",
    });
    api.mockResolvedValue({ status: 409, data: null, detail: "domain_in_use" });
    expect(await deleteDomain("d1")).toEqual({ error: "inUse" });
  });
});
