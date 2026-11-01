import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
const tenant = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: () => tenant(),
}));

const { createCustomField, deleteCustomField, updateCustomField } =
  await import("./custom-field-actions");

const anchor = { id: "root", anchor: true, languages: ["en", "es"] };
const account = { id: "t1", anchor: false, languages: ["en"] };

beforeEach(() => {
  api.mockReset();
  tenant.mockResolvedValue(account);
});

function form(values: Record<string, unknown>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values))
    if (Array.isArray(value) && key === "formats")
      for (const each of value) data.append(key, each);
    else
      data.set(key, typeof value === "string" ? value : JSON.stringify(value));
  return data;
}

const labels = { en: "Badge", es: "Placa" };
const text = { key: " badge ", type: "text", labels };

/** What the API was sent, after a field was saved. */
async function sent(values: Record<string, unknown>) {
  api.mockResolvedValue({ status: 201, data: {}, detail: null });
  await expect(createCustomField({}, form(values))).rejects.toEqual(
    new Redirected("/dashboard/fields"),
  );
  return api.mock.calls[0][1].body;
}

describe("an account's own field", () => {
  it("is added in the account's languages only", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createCustomField(
        {},
        form({ ...text, max_length: "20", pattern: "^[A-Z]+$" }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/fields"));
    expect(api).toHaveBeenCalledWith("/tenants/t1/fields", {
      method: "POST",
      body: {
        key: "badge",
        labels: { en: "Badge" },
        type: "text",
        max_length: 20,
        pattern: "^[A-Z]+$",
      },
      token: "the-session",
    });
  });

  it("sends a list's options with values, trimmed", async () => {
    const body = await sent({
      ...text,
      type: "code",
      options: [
        { value: " a ", labels: { en: " A ", es: "A" } },
        { value: " ", labels: {} },
      ],
    });
    expect(body.options).toEqual([{ value: "a", labels: { en: "A" } }]);
  });

  it("sends a value list in place of options", async () => {
    const body = await sent({
      ...text,
      type: "codes",
      domain: "sex",
      options: [{ value: "a", labels: { en: "A" } }],
    });
    expect(body).toMatchObject({ domain: "sex" });
    expect(body).not.toHaveProperty("options");
  });

  it("sends a file's formats", async () => {
    const body = await sent({ ...text, type: "file", formats: ["pdf", "png"] });
    expect(body.formats).toEqual(["pdf", "png"]);
  });

  it("sends a group's parts", async () => {
    const body = await sent({
      ...text,
      type: "group",
      parts: [
        {
          key: " street ",
          required: true,
          type: "text",
          labels: { en: "Street", es: "Calle" },
          max_length: "80",
          uid: "u1",
        },
        {
          key: "kind",
          required: false,
          type: "code",
          labels: { en: "Kind", es: "Tipo" },
          domain: "kinds",
        },
        { key: " ", required: false, type: "text", labels: {} },
      ],
    });
    expect(body.parts).toEqual([
      {
        key: "street",
        required: true,
        type: "text",
        labels: { en: "Street", es: "Calle" },
        max_length: 80,
      },
      {
        key: "kind",
        required: false,
        type: "code",
        labels: { en: "Kind", es: "Tipo" },
        domain: "kinds",
      },
    ]);
  });

  const part = { key: "p", required: true, type: "text", labels };

  it.each([
    [{ key: "" }, "keyRequired"],
    [{ labels: { es: "Placa" } }, "labelsRequired"],
    [{ max_length: "0" }, "lengthInvalid"],
    [{ max_length: "two" }, "lengthInvalid"],
    [{ type: "group", parts: [] }, "partsInvalid"],
    [
      { type: "group", parts: [{ ...part, labels: { en: "P" } }] },
      "partsInvalid",
    ],
    [{ type: "group", parts: [{ ...part, type: "code" }] }, "partsInvalid"],
    [
      { type: "group", parts: [{ ...part, max_length: "-1" }] },
      "lengthInvalid",
    ],
  ])("refuses %o before calling the API", async (change, error) => {
    const state = await createCustomField({}, form({ ...text, ...change }));
    expect(state.error).toBe(error);
    expect(api).not.toHaveBeenCalled();
  });

  it("is changed, never its key", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await expect(
      updateCustomField("f/1", { key: "badge" }, form(text)),
    ).rejects.toEqual(new Redirected("/dashboard/fields"));
    const [path, init] = api.mock.calls[0];
    expect(path).toBe("/tenants/t1/fields/f%2F1");
    expect(init.method).toBe("PATCH");
    expect(init.body).not.toHaveProperty("key");
  });

  it("says a field in use takes only some changes", async () => {
    api.mockResolvedValue({ status: 409, data: null, detail: "field_in_use" });
    const state = await updateCustomField("f1", { key: "badge" }, form(text));
    expect(state).toMatchObject({ key: "badge", error: "inUseChange" });
  });

  it("is deleted while nothing uses it", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    expect(await deleteCustomField("f1")).toEqual({});
    expect(api).toHaveBeenCalledWith("/tenants/t1/fields/f1", {
      method: "DELETE",
      token: "the-session",
    });
    api.mockResolvedValue({ status: 409, data: null, detail: "field_in_use" });
    expect(await deleteCustomField("f1")).toEqual({ error: "inUse" });
  });

  it.each([
    ["key_invalid", "keyInvalid"],
    ["key_reserved", "keyReserved"],
    ["key_exists", "keyExists"],
    ["labels_required", "labelsRequired"],
    ["constraint_invalid", "unavailable"],
    ["pattern_invalid", "patternInvalid"],
    ["options_invalid", "optionsInvalid"],
    ["formats_invalid", "formatsInvalid"],
    ["category_invalid", "categoryRequired"],
    ["source_required", "sourceRequired"],
    ["anchor_only", "unavailable"],
    ["subscription_required", "subscriptionRequired"],
    ["domain_invalid", "domainInvalid"],
    ["parts_invalid", "partsInvalid"],
    [null, "unavailable"],
  ])("words %s", async (detail, error) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    expect((await createCustomField({}, form(text))).error).toBe(error);
  });
});

describe("the trust anchor's fields", () => {
  beforeEach(() => tenant.mockResolvedValue(anchor));

  const filed = { ...text, category: "identity", source: "ISO 18013-5" };

  it("are sent filed and sourced", async () => {
    const body = await sent(filed);
    expect(api.mock.calls[0][0]).toBe("/tenants/root/fields");
    expect(body).toMatchObject({
      labels,
      category: "identity",
      source: "ISO 18013-5",
    });
  });

  it.each([
    [{ labels: { en: "Badge" } }, "labelsEvery"],
    [{ category: "" }, "categoryRequired"],
    [{ source: "" }, "sourceRequired"],
  ])("refuse %o before calling the API", async (change, error) => {
    const state = await createCustomField({}, form({ ...filed, ...change }));
    expect(state.error).toBe(error);
    expect(api).not.toHaveBeenCalled();
  });
});
