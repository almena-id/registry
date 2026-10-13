import { describe, expect, it } from "vitest";

import {
  codesOf,
  credentialDraftOf,
  draftFor,
  fieldDraftOf,
  fillsOf,
  toCredential,
  toField,
  type Catalogue,
} from "./form-fields";

const catalogue: Catalogue = {
  version: "1",
  languages: ["en", "es"],
  categories: [],
  domains: {
    country: {
      labels: { en: "Countries" },
      source: "ISO 3166-1",
      codes: [
        { value: "ES", labels: { en: "Spain" } },
        { value: "PT", labels: { en: "Portugal" } },
        { value: "FR", labels: { en: "France" } },
      ],
    },
  },
  fields: [
    {
      id: "nationalities",
      type: "codes",
      labels: { en: "Nationalities" },
      source: "OIDC",
      domain: "country",
      narrowing: ["values"],
    },
    {
      id: "birthdate",
      type: "date",
      labels: { en: "Birthdate" },
      source: "OIDC",
      narrowing: ["min_date", "max_date"],
    },
    {
      id: "europe",
      type: "code",
      labels: { en: "Iberia" },
      source: "custom",
      domain: "country",
      values: ["ES", "PT"],
    },
  ],
};

describe("a form's field", () => {
  it("is sent with only what its type narrows, values typed as the domain's", () => {
    const draft = {
      ...draftFor("f0", "nationalities"),
      values: ["PT", "ES"],
      // Typed for another field before: not this one's to send.
      min_date: "2000-01-01",
      help: { en: " Yours ", es: "" },
    };
    expect(toField(draft, catalogue)).toEqual({
      ref: "nationalities",
      required: true,
      help: { en: "Yours" },
      narrow: { values: ["ES", "PT"] },
    });
  });

  it("sends nothing narrowed when nothing is", () => {
    expect(toField(draftFor("f1", "birthdate"), catalogue)).toEqual({
      ref: "birthdate",
      required: true,
    });
  });

  it("comes back as the draft it was made from", () => {
    const field = {
      ref: "birthdate",
      required: false,
      narrow: { max_date: "2008-01-01" },
    };
    const draft = fieldDraftOf(field, "e0");
    expect(draft.max_date).toBe("2008-01-01");
    expect(toField(draft, catalogue)).toEqual(field);
  });

  it("takes only the values its own field allows", () => {
    const field = catalogue.fields[2];
    expect(codesOf(catalogue, field).map((code) => code.value)).toEqual([
      "ES",
      "PT",
    ]);
  });
});

describe("a credential asked for", () => {
  it("is sent with its purpose only when written, its issuers only when chosen", () => {
    const request = {
      key: "email",
      type: "verified_email",
      required: true,
      claims: ["email"],
      trust: "registry" as const,
      fills: [],
    };
    const draft = credentialDraftOf(request, "e0");
    expect(toCredential(draft)).toEqual({
      key: "email",
      type: "verified_email",
      required: true,
      claims: ["email"],
      trust: "registry",
    });
    expect(
      toCredential({
        ...draft,
        trust: "issuers",
        issuers: ["did:x"],
        purpose: { es: "Para escribirte" },
      }),
    ).toMatchObject({ issuers: ["did:x"], purpose: { es: "Para escribirte" } });
  });

  it("fills the fields named as its claims, never one renamed", () => {
    expect(
      fillsOf(
        ["email", "given_name", "campus"],
        [
          { ref: "email" },
          { ref: "given_name", as: "first" },
          { ref: "custom:campus" },
        ],
      ),
    ).toEqual(["email", "campus"]);
  });
});
