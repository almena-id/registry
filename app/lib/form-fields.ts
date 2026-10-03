/**
 * Forms and Almena's field catalogue, as the API serves them. Tenants do not
 * define fields: a form picks them from the catalogue and only says whether
 * each is required, adds a line of help, names a repeatable one (`as`) and
 * makes it stricter (`narrow`). A module of its own so the client builder,
 * the list and the server action share it.
 */

import { cleanTexts, hasText, type Texts } from "./texts";

export type Labels = Record<string, string>;
export type FieldType =
  "text" | "email" | "phone" | "date" | "code" | "codes" | "file" | "group";
export type Narrowing = "values" | "min_date" | "max_date" | "max_length";
export type CodeValue = string | number;

export type CatalogueField = {
  id: string;
  type: FieldType;
  labels: Labels;
  source: string;
  /** Top-level fields only; a group's parts have none. */
  category?: string;
  schema?: string;
  narrowing?: Narrowing[];
  repeatable?: boolean;
  domain?: string;
  /** The domain's values this field takes, when not all of them. */
  values?: CodeValue[];
  max_length?: number;
  /** The tenant's own fields: a text's pattern, a list's options inline. */
  pattern?: string;
  codes?: Code[];
  parts?: { key: string; required: boolean; field: CatalogueField }[];
};

/** How forms name one of the tenant's own fields: `custom:{key}`. */
export const CUSTOM = "custom:";

export type Code = { value: CodeValue; labels: Labels; media_type?: string };

export type Catalogue = {
  version: string;
  languages: string[];
  categories: { id: string; labels: Labels }[];
  fields: CatalogueField[];
  domains: Record<string, { labels: Labels; source: string; codes: Code[] }>;
};

export type Narrow = {
  values?: CodeValue[];
  min_date?: string;
  max_date?: string;
  max_length?: number;
};

/** A form's field, as the API keeps it. */
export type FormField = {
  ref: string;
  as?: string;
  required: boolean;
  help?: Texts;
  narrow?: Narrow;
};

/** A form's field while it is being written: every input as typed. */
export type FieldDraft = {
  /** Only for React's lists; never sent. */
  id: string;
  ref: string;
  as: string;
  required: boolean;
  help: Texts;
  /** The values ticked, as strings; none ticked accepts all. */
  values: string[];
  min_date: string;
  max_date: string;
  max_length: string;
};

export function draftFor(id: string, ref: string, as = ""): FieldDraft {
  return {
    id,
    ref,
    as,
    required: true,
    help: {},
    values: [],
    min_date: "",
    max_date: "",
    max_length: "",
  };
}

/** A label in the visitor's language, else English. */
export function label(
  labels: Record<string, string | undefined>,
  locale: string,
): string {
  return (
    labels[locale] || labels.en || Object.values(labels).find(Boolean) || ""
  );
}

export function byId(catalogue: Catalogue): Map<string, CatalogueField> {
  return new Map(catalogue.fields.map((field) => [field.id, field]));
}

/** The codes a coded or file field takes, before a form narrows them. */
export function codesOf(catalogue: Catalogue, field: CatalogueField): Code[] {
  if (field.codes) return field.codes;
  const codes = field.domain
    ? (catalogue.domains[field.domain]?.codes ?? [])
    : [];
  return field.values
    ? codes.filter((code) => field.values?.includes(code.value))
    : codes;
}

export type FieldProblem =
  "keyInvalid" | "keyDuplicate" | "narrowInvalid" | "fieldUnknown";

/**
 * The draft as the API takes it. The API checks it — and says which field
 * does not hold — so the builder can point at it.
 */
export function toField(draft: FieldDraft, catalogue: Catalogue): FormField {
  const item = byId(catalogue).get(draft.ref);
  const field: FormField = { ref: draft.ref, required: draft.required };
  const as = draft.as.trim();
  if (as) field.as = as;
  const help = cleanTexts(draft.help);
  if (hasText(help)) field.help = help;

  // Only what the field's type can be narrowed by: a draft keeps what was
  // typed for another field it named before.
  const narrow: Narrow = {};
  const allows = new Set(item?.narrowing ?? []);
  if (item && allows.has("values") && draft.values.length) {
    // Typed as the domain types them.
    narrow.values = codesOf(catalogue, item)
      .filter((code) => draft.values.includes(String(code.value)))
      .map((code) => code.value);
  }
  if (allows.has("min_date") && draft.min_date)
    narrow.min_date = draft.min_date;
  if (allows.has("max_date") && draft.max_date)
    narrow.max_date = draft.max_date;
  if (allows.has("max_length") && draft.max_length.trim())
    narrow.max_length = Number(draft.max_length);
  if (Object.keys(narrow).length) field.narrow = narrow;
  return field;
}

/** A form's field as a list shows it: every part already worded. */
export type DescribedField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  help?: string;
  parts: string[];
  restrictions: string[];
};

export function describe(
  field: FormField,
  catalogue: Catalogue,
  locale: string,
  words: {
    types: Record<FieldType, string>;
    restrictions: Record<Narrowing, string>;
  },
): DescribedField {
  const item = byId(catalogue).get(field.ref);
  const restrictions: string[] = [];
  const narrow = field.narrow ?? {};
  const say = (key: Narrowing, value: unknown) => {
    if (value !== undefined)
      restrictions.push(
        words.restrictions[key].replace("{value}", String(value)),
      );
  };
  if (item && narrow.values) {
    const codes = codesOf(catalogue, item);
    say(
      "values",
      narrow.values
        .map((value) => {
          const code = codes.find((c) => c.value === value);
          return code ? label(code.labels, locale) : String(value);
        })
        .join(", "),
    );
  }
  say("min_date", narrow.min_date);
  say("max_date", narrow.max_date);
  say("max_length", narrow.max_length);
  return {
    key: field.as ?? field.ref.replace(CUSTOM, ""),
    label: item ? label(item.labels, locale) : field.ref,
    type: item ? words.types[item.type] : "",
    required: field.required,
    help: field.help ? label(field.help, locale) : undefined,
    parts: (item?.parts ?? []).map((part) => label(part.field.labels, locale)),
    restrictions,
  };
}

/** A credential a form asks to be presented, as the API keeps it. */
export type TrustMode = "registry" | "issuers" | "framework";
export type CredentialRequest = {
  key: string;
  type: string;
  required: boolean;
  purpose?: Texts;
  claims: string[];
  trust: TrustMode;
  issuers?: string[];
  /** The keys of the form's fields it fills. */
  fills: string[];
};

/** A credential request while it is being written. */
export type CredentialDraft = {
  /** Only for React's lists; never sent. */
  id: string;
  key: string;
  type: string;
  required: boolean;
  purpose: Texts;
  /** The type's claims ticked; all of them to begin with. */
  claims: string[];
  trust: TrustMode;
  /** `issuers`: the DIDs ticked. */
  issuers: string[];
};

export type CredentialProblem =
  | "credentialKeyInvalid"
  | "credentialKeyDuplicate"
  | "credentialTypeDuplicate"
  | "claimsInvalid"
  | "trustInvalid";

/** The draft as the API takes it; the API checks it and says which does not hold. */
export function toCredential(draft: CredentialDraft): Record<string, unknown> {
  const request: Record<string, unknown> = {
    key: draft.key.trim(),
    type: draft.type,
    required: draft.required,
    claims: draft.claims,
    trust: draft.trust,
  };
  const purpose = cleanTexts(draft.purpose);
  if (hasText(purpose)) request.purpose = purpose;
  if (draft.trust === "issuers") request.issuers = draft.issuers;
  return request;
}

/** The fields a credential fills: Almena's, under their own name, it asks for. */
export function fillsOf(
  claims: string[],
  fields: { ref: string; as?: string }[],
) {
  const named = new Set(
    fields.filter((field) => !field.as).map((field) => field.ref),
  );
  return claims.filter((claim) => named.has(claim));
}
