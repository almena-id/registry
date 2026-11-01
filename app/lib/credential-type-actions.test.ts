import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
const tenant = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: () => tenant(),
}));

const { createCredentialType, deleteCredentialType, updateCredentialType } =
  await import("./credential-type-actions");

const anchor = { id: "root", anchor: true, languages: ["en", "es"] };
const account = { id: "t1", anchor: false, languages: ["en"] };

beforeEach(() => {
  api.mockReset();
  tenant.mockResolvedValue(account);
});

function form(values: Record<string, unknown>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values))
    data.set(key, typeof value === "string" ? value : JSON.stringify(value));
  return data;
}

const claims = [{ field: "given_name", required: true }];
const typed = {
  key: " member ",
  labels: { en: "Member", es: "Socio" },
  descriptions: { en: "A member", es: "Un socio" },
  category: "membership",
  source: "",
  claims,
};

describe("an account's own credential type", () => {
  it("is added in the account's languages only, issued by Almena", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(createCredentialType({}, form(typed))).rejects.toEqual(
      new Redirected("/dashboard/credential-types"),
    );
    expect(api).toHaveBeenCalledWith("/tenants/t1/credential-types", {
      method: "POST",
      body: {
        key: "member",
        labels: { en: "Member" },
        descriptions: { en: "A member" },
        category: "membership",
        source: "",
        claims,
        issuance: "almena",
        vct: null,
        w3c_type: null,
        mdoc_doctype: null,
      },
      token: "the-session",
    });
  });

  it("never issues outside Almena", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createCredentialType(
        {},
        form({ ...typed, issuance: "external", vct: "urn:x" }),
      ),
    ).rejects.toBeInstanceOf(Redirected);
    expect(api.mock.calls[0][1].body).toMatchObject({
      issuance: "almena",
      vct: null,
    });
  });

  it.each([
    [{ key: "" }, "keyRequired"],
    [{ labels: { es: "Socio" } }, "labelsRequired"],
    [{ descriptions: {} }, "descriptionsRequired"],
    [{ category: "" }, "categoryRequired"],
    [{ claims: [] }, "claimsInvalid"],
    [{ claims: "not json" }, "claimsInvalid"],
  ])("refuses %o before calling the API", async (change, error) => {
    const state = await createCredentialType({}, form({ ...typed, ...change }));
    expect(state.error).toBe(error);
    expect(api).not.toHaveBeenCalled();
  });

  it("is changed, never its key", async () => {
    api.mockResolvedValue({ status: 200, data: {}, detail: null });
    await expect(
      updateCredentialType("c/1", { key: "member" }, form(typed)),
    ).rejects.toEqual(new Redirected("/dashboard/credential-types"));
    const [path, init] = api.mock.calls[0];
    expect(path).toBe("/tenants/t1/credential-types/c%2F1");
    expect(init.method).toBe("PATCH");
    expect(init.body).not.toHaveProperty("key");
  });

  it("says a type in use takes only some changes", async () => {
    api.mockResolvedValue({
      status: 409,
      data: null,
      detail: "credential_type_in_use",
    });
    const state = await updateCredentialType(
      "c1",
      { key: "member" },
      form(typed),
    );
    expect(state).toMatchObject({ key: "member", error: "typeInUseChange" });
  });

  it("is deleted while nothing uses it", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    expect(await deleteCredentialType("c1")).toEqual({});
    expect(api).toHaveBeenCalledWith("/tenants/t1/credential-types/c1", {
      method: "DELETE",
      token: "the-session",
    });
    api.mockResolvedValue({
      status: 409,
      data: null,
      detail: "credential_type_in_use",
    });
    expect(await deleteCredentialType("c1")).toEqual({ error: "typeInUse" });
  });

  it.each([
    ["key_invalid", "keyInvalid"],
    ["key_exists", "typeKeyExists"],
    ["labels_required", "labelsEvery"],
    ["descriptions_required", "descriptionsEvery"],
    ["category_invalid", "categoryRequired"],
    ["source_required", "sourceRequired"],
    ["claims_invalid", "claimsInvalid"],
    ["vct_invalid", "vctInvalid"],
    ["w3c_type_invalid", "w3cTypeInvalid"],
    ["mdoc_doctype_invalid", "doctypeInvalid"],
    ["issuance_invalid", "unavailable"],
    ["subscription_required", "subscriptionRequired"],
    [null, "unavailable"],
  ])("words %s", async (detail, error) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    expect((await createCredentialType({}, form(typed))).error).toBe(error);
  });
});

describe("the trust anchor's credential types", () => {
  beforeEach(() => tenant.mockResolvedValue(anchor));

  const standard = {
    ...typed,
    source: "EUDI ARF",
    issuance: "external",
    vct: "urn:eu.europa.ec.eudi:pid:1",
    w3c_type: "PersonIdentificationData",
    mdoc_doctype: "eu.europa.ec.eudi.pid.1",
  };

  it("are sent with their standard and who issues them", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createCredentialType({}, form(standard)),
    ).rejects.toBeInstanceOf(Redirected);
    expect(api.mock.calls[0][0]).toBe("/tenants/root/credential-types");
    expect(api.mock.calls[0][1].body).toMatchObject({
      labels: { en: "Member", es: "Socio" },
      source: "EUDI ARF",
      issuance: "external",
      vct: "urn:eu.europa.ec.eudi:pid:1",
      w3c_type: "PersonIdentificationData",
      mdoc_doctype: "eu.europa.ec.eudi.pid.1",
    });
  });

  it.each([
    [{ labels: { en: "Member" } }, "labelsEvery"],
    [{ descriptions: { en: "A member" } }, "descriptionsEvery"],
    [{ source: "" }, "sourceRequired"],
    [{ vct: "" }, "vctInvalid"],
  ])("refuse %o before calling the API", async (change, error) => {
    const state = await createCredentialType(
      {},
      form({ ...standard, ...change }),
    );
    expect(state.error).toBe(error);
    expect(api).not.toHaveBeenCalled();
  });
});
