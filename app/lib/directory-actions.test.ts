import { beforeEach, describe, expect, it, vi } from "vitest";

import { Redirected } from "@/test/next";

const api = vi.fn();
vi.mock("./api", () => ({
  sessionCookie: "almena.session",
  api: (...args: unknown[]) => api(...args),
  currentTenant: async () => ({ id: "t1", languages: ["en"] }),
}));
const fetchPage = vi.fn();
vi.mock("./directory", () => ({
  fetchPage: (...args: unknown[]) => fetchPage(...args),
}));

const {
  createItem,
  deleteIdentity,
  deleteItem,
  loadMore,
  renameIdentity,
  saveDescribed,
  saveMediator,
  saveSigning,
  setPublished,
} = await import("./directory-actions");

beforeEach(() => {
  api.mockReset();
  fetchPage.mockReset();
});

function form(values: Record<string, unknown>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values))
    data.set(key, typeof value === "string" ? value : JSON.stringify(value));
  return data;
}

const described = {
  name: " Town hall ",
  description: { en: "Ours", es: "Nuestro" },
  mediator: "m1",
};

describe("the next page of a list", () => {
  it("is asked for a section only", async () => {
    fetchPage.mockResolvedValue({ items: [], next_cursor: null });
    expect(await loadMore("issuers", "c1")).toEqual({
      items: [],
      next_cursor: null,
    });
    expect(fetchPage).toHaveBeenCalledWith("issuers", "c1");
    expect(await loadMore("nope", "c1")).toBeNull();
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});

describe("adding to a section", () => {
  it("sends an issuer described in the account's languages", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(createItem("issuers", {}, form(described))).rejects.toEqual(
      new Redirected("/dashboard/issuers"),
    );
    expect(api).toHaveBeenCalledWith("/tenants/t1/issuers", {
      method: "POST",
      body: {
        name: "Town hall",
        description: { en: "Ours" },
        mediator_id: "m1",
      },
      token: "the-session",
    });
  });

  it("sends no description or mediator when none is given", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createItem("verifiers", {}, form({ name: "Gate" })),
    ).rejects.toBeInstanceOf(Redirected);
    expect(api.mock.calls[0][1].body).toEqual({
      name: "Gate",
      description: null,
      mediator_id: null,
    });
  });

  it("sends a mediator's address and whether it is public", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createItem(
        "mediators",
        {},
        form({ name: "M", subdomain: " m ", domain: "d1", public: "on" }),
      ),
    ).rejects.toEqual(new Redirected("/dashboard/mediators"));
    expect(api.mock.calls[0][1].body).toEqual({
      name: "M",
      subdomain: "m",
      domain_id: "d1",
      public: true,
    });
  });

  it("sends an identity's name only", async () => {
    api.mockResolvedValue({ status: 201, data: {}, detail: null });
    await expect(
      createItem("identities", {}, form(described)),
    ).rejects.toBeInstanceOf(Redirected);
    expect(api.mock.calls[0][1].body).toEqual({ name: "Town hall" });
  });

  it.each([
    ["issuers", { name: "" }, { name: "nameRequired" }],
    ["issuers", { name: "x".repeat(201) }, { name: "nameLong" }],
    [
      "issuers",
      { name: "A", description: { en: "x".repeat(2001) } },
      { description: "descriptionLong" },
    ],
    [
      "mediators",
      { name: "A" },
      { subdomain: "subdomainRequired", domain: "domainRequired" },
    ],
    ["nope", { name: "A" }, { form: "unavailable" }],
  ])(
    "refuses %s %o before calling the API",
    async (section, values, errors) => {
      expect((await createItem(section, {}, form(values))).errors).toEqual(
        errors,
      );
      expect(api).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["subdomain_invalid", { subdomain: "subdomainInvalid" }],
    ["domain_not_found", { domain: "domainNotFound" }],
    ["domain_unverified", { domain: "domainUnverified" }],
    ["mediator_not_found", { mediator: "mediatorNotFound" }],
    [null, { form: "unavailable" }],
  ])("words %s", async (detail, errors) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    const state = await createItem(
      "mediators",
      {},
      form({ name: "M", subdomain: "m", domain: "d1" }),
    );
    expect(state).toMatchObject({ name: "M", subdomain: "m", errors });
  });
});

describe("saving a mediator", () => {
  it("moves it to a new address", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { name: "M2", public: true },
      detail: null,
    });
    expect(
      await saveMediator(
        "m/1",
        {},
        form({ name: "M2", subdomain: "m2", domain: "d1", public: "on" }),
      ),
    ).toEqual({
      name: "M2",
      subdomain: "m2",
      domain: "d1",
      public: true,
      saved: true,
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1/mediators/m%2F1", {
      method: "PATCH",
      body: { name: "M2", subdomain: "m2", domain_id: "d1", public: true },
      token: "the-session",
    });
  });

  it("leaves it where it is with no subdomain", async () => {
    api.mockResolvedValue({ status: 200, data: { name: "M", public: false } });
    await saveMediator("m1", {}, form({ name: "M" }));
    expect(api.mock.calls[0][1].body).toEqual({ name: "M", public: false });
  });

  it.each([
    [{ name: "" }, { name: "nameRequired" }],
    [{ name: "x".repeat(201) }, { name: "nameLong" }],
    [{ name: "M", subdomain: "m" }, { domain: "domainRequired" }],
  ])("refuses %o before calling the API", async (values, errors) => {
    expect((await saveMediator("m1", {}, form(values))).errors).toEqual(errors);
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["subdomain_invalid", { subdomain: "subdomainInvalid" }],
    ["domain_not_found", { domain: "domainNotFound" }],
    ["domain_unverified", { domain: "domainUnverified" }],
    ["name_required", { name: "nameRequired" }],
    [null, { form: "unavailable" }],
  ])("words %s", async (detail, errors) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    const state = await saveMediator(
      "m1",
      {},
      form({ name: "M", subdomain: "m", domain: "d1" }),
    );
    expect(state.errors).toEqual(errors);
  });
});

describe("saving an issuer or verifier", () => {
  it("sends its name, description and mediator", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { name: "Town hall", description: null, mediator: { id: "m1" } },
      detail: null,
    });
    expect(
      await saveDescribed("verifiers", "v/1", {}, form(described)),
    ).toEqual({
      name: "Town hall",
      description: {},
      mediator: "m1",
      saved: true,
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1/verifiers/v%2F1", {
      method: "PATCH",
      body: {
        name: "Town hall",
        description: { en: "Ours" },
        mediator_id: "m1",
      },
      token: "the-session",
    });
  });

  it.each([
    [{ name: "" }, { name: "nameRequired" }],
    [{ name: "x".repeat(201) }, { name: "nameLong" }],
    [
      { name: "A", description: { en: "x".repeat(2001) } },
      { description: "descriptionLong" },
    ],
  ])("refuses %o before calling the API", async (values, errors) => {
    expect(
      (await saveDescribed("issuers", "i1", {}, form(values))).errors,
    ).toEqual(errors);
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["name_required", { name: "nameRequired" }],
    ["mediator_not_found", { mediator: "mediatorNotFound" }],
    [null, { form: "unavailable" }],
  ])("words %s", async (detail, errors) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    const state = await saveDescribed("issuers", "i1", {}, form(described));
    expect(state).toMatchObject({ name: "Town hall", errors });
  });
});

describe("publishing", () => {
  it("publishes, or takes it back", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { published_at: "2026-11-01" },
    });
    expect(await setPublished("issuers", "i/1", { published: false })).toEqual({
      published: true,
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1/issuers/i%2F1/publish", {
      method: "POST",
      token: "the-session",
    });
    api.mockResolvedValue({ status: 200, data: { published_at: null } });
    expect(await setPublished("mediators", "m1", { published: true })).toEqual({
      published: false,
    });
    expect(api.mock.calls[1][0]).toBe("/tenants/t1/mediators/m1/unpublish");
  });

  it.each([
    ["identity_pending", { pendingIdentity: true }],
    ["tenant_pending", { pendingTenant: true }],
    [null, { failed: true }],
  ])("words %s", async (detail, more) => {
    api.mockResolvedValue({ status: 409, data: null, detail });
    expect(await setPublished("issuers", "i1", { published: false })).toEqual({
      published: false,
      ...more,
    });
  });
});

describe("deleting from a section", () => {
  it("deletes it, back to its list", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await expect(
      deleteItem("verifiers", "v1", { published: false }),
    ).rejects.toEqual(new Redirected("/dashboard/verifiers"));
    expect(api).toHaveBeenCalledWith("/tenants/t1/verifiers/v1", {
      method: "DELETE",
      token: "the-session",
    });
  });

  it("says it failed", async () => {
    api.mockResolvedValue({ status: 409, data: null, detail: "x" });
    expect(await deleteItem("issuers", "i1", { published: true })).toEqual({
      published: true,
      failed: true,
    });
  });
});

describe("how an issuer or verifier signs", () => {
  it("is set to one member", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { system: "single_user", signer: { id: "u1" } },
      detail: null,
    });
    expect(
      await saveSigning(
        "issuers",
        "i/1",
        { system: "", signer: "" },
        form({ system: "single_user", signer: "u1" }),
      ),
    ).toEqual({ system: "single_user", signer: "u1", saved: true });
    expect(api).toHaveBeenCalledWith("/tenants/t1/issuers/i%2F1/signing", {
      method: "PUT",
      body: { system: "single_user", user_id: "u1" },
      token: "the-session",
    });
  });

  it("is cleared", async () => {
    api.mockResolvedValue({
      status: 200,
      data: { system: null, signer: null },
    });
    expect(
      await saveSigning(
        "verifiers",
        "v1",
        { system: "", signer: "" },
        form({ system: "" }),
      ),
    ).toEqual({ system: "", signer: "", saved: true });
    expect(api.mock.calls[0][1].body).toEqual({ system: null, user_id: null });
  });

  it("asks for the signer before calling the API", async () => {
    const state = await saveSigning(
      "issuers",
      "i1",
      { system: "", signer: "" },
      form({ system: "single_user" }),
    );
    expect(state.errors).toEqual({ signer: "signerRequired" });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ["signer_required", { signer: "signerRequired" }],
    ["signer_not_member", { signer: "signerNotMember" }],
    [null, { form: "unavailable" }],
  ])("words %s", async (detail, errors) => {
    api.mockResolvedValue({ status: 422, data: null, detail });
    const state = await saveSigning(
      "issuers",
      "i1",
      { system: "", signer: "" },
      form({ system: "single_user", signer: "u9" }),
    );
    expect(state).toEqual({ system: "single_user", signer: "u9", errors });
  });
});

describe("an identity", () => {
  it("is renamed", async () => {
    api.mockResolvedValue({ status: 200, data: { name: "New" }, detail: null });
    expect(await renameIdentity("d/1", {}, form({ name: " New " }))).toEqual({
      name: "New",
      saved: true,
    });
    expect(api).toHaveBeenCalledWith("/tenants/t1/identities/d%2F1", {
      method: "PATCH",
      body: { name: "New" },
      token: "the-session",
    });
  });

  it.each([
    ["", "nameRequired"],
    ["x".repeat(201), "nameLong"],
  ])("refuses the name %#", async (name, error) => {
    expect((await renameIdentity("d1", {}, form({ name }))).errors).toEqual({
      name: error,
    });
    expect(api).not.toHaveBeenCalled();
  });

  it("says a rename failed", async () => {
    api.mockResolvedValue({ status: 404, data: null, detail: null });
    expect(
      (await renameIdentity("d1", {}, form({ name: "A" }))).errors,
    ).toEqual({ form: "unavailable" });
  });

  it("is deleted, back to the list", async () => {
    api.mockResolvedValue({ status: 204, data: null, detail: null });
    await expect(deleteIdentity("d1")).rejects.toEqual(
      new Redirected("/dashboard/identities"),
    );
    expect(api).toHaveBeenCalledWith("/tenants/t1/identities/d1", {
      method: "DELETE",
      token: "the-session",
    });
  });

  it.each([
    ["identity_in_use", 409, "inUse"],
    ["identity_signed", 409, "signed"],
    [null, 404, "gone"],
    [null, null, "failed"],
  ])("words %s (%s) when deleting", async (detail, status, error) => {
    api.mockResolvedValue({ status, data: null, detail });
    expect(await deleteIdentity("d1")).toEqual({ error });
  });
});
