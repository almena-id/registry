import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1", languages: ["en"] }),
}));
vi.mock("./field-catalog", () => ({
  fetchTenantCatalogue: async () => ({
    version: "1",
    languages: ["en"],
    categories: [],
    domains: {},
    fields: [
      { id: "given_name", type: "text", labels: { en: "Name" }, source: "OIDC" },
    ],
  }),
}));

const { createForm, updateForm } = await import("./form-actions");

function formData(values: Record<string, unknown>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values))
    data.set(key, JSON.stringify(value));
  return data;
}

const field = { ...{ id: "d0", ref: "given_name", as: "", required: true }, help: {}, values: [], min_date: "", max_date: "", max_length: "" };

beforeEach(() => api.mockReset());

describe("saving a form", () => {
  it("asks for a name and a field before calling the API", async () => {
    const state = await createForm({}, formData({ name: {}, fields: [] }));
    expect(state.errors).toEqual({ name: "nameRequired", form: "fieldsRequired" });
    expect(api).not.toHaveBeenCalled();
  });

  it("sends texts in the account's languages only", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createForm(
        {},
        formData({
          name: { en: "Join", es: "Únete" },
          fields: [{ ...field, help: { en: "Yours", es: "Tuyo" } }],
        }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/forms"));
    const [path, init] = api.mock.calls[0];
    expect(path).toBe("/tenants/t1/forms");
    expect(init.method).toBe("POST");
    expect(init.body.name).toEqual({ en: "Join" });
    expect(init.body.fields[0].help).toEqual({ en: "Yours" });
  });

  it("points at the field a form in use cannot take", async () => {
    api.mockResolvedValue({
      status: 409,
      data: null,
      detail: "form_in_use",
      failure: { detail: "form_in_use", field: 0 },
    });
    const state = await updateForm(
      "f1",
      {},
      formData({ name: { en: "Join" }, fields: [field] }),
    );
    expect(api.mock.calls[0][0]).toBe("/tenants/t1/forms/f1");
    expect(api.mock.calls[0][1].method).toBe("PUT");
    expect(state.errors).toEqual({ field: { id: "d0", problem: "inUseField" } });
  });

  it("words a refusal of the whole form", async () => {
    api.mockResolvedValue({
      status: 409,
      data: null,
      detail: "form_in_use",
      failure: { detail: "form_in_use" },
    });
    const state = await updateForm("f1", {}, formData({ name: { en: "J" }, fields: [field] }));
    expect(state.errors).toEqual({ form: "inUse" });
  });
});
