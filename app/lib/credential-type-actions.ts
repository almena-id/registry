"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { locales, type Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { hasText, textsFrom, type Texts } from "./texts";

type ErrorKey = keyof Dictionary["dashboard"]["catalogue"]["errors"];

/** A claim as ticked: one of the catalogue's fields, always present or not. */
export type ClaimDraft = { field: string; required: boolean };

export type CredentialTypeState = {
  key?: string;
  labels?: Texts;
  descriptions?: Texts;
  category?: string;
  source?: string;
  claims?: ClaimDraft[];
  issuance?: string;
  vct?: string;
  w3c_type?: string;
  mdoc_doctype?: string;
  error?: ErrorKey;
};

const CODES: Record<string, ErrorKey> = {
  key_invalid: "keyInvalid",
  key_exists: "typeKeyExists",
  labels_required: "labelsEvery",
  descriptions_required: "descriptionsEvery",
  category_invalid: "categoryRequired",
  source_required: "sourceRequired",
  claims_invalid: "claimsInvalid",
  vct_invalid: "vctInvalid",
  w3c_type_invalid: "w3cTypeInvalid",
  mdoc_doctype_invalid: "doctypeInvalid",
  credential_type_in_use: "typeInUse",
  issuance_invalid: "unavailable",
  subscription_required: "subscriptionRequired",
};

async function call(
  path: string,
  init: { method: string; body?: unknown },
): Promise<ErrorKey | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return "unavailable";
  const { status, detail } = await api(
    `/tenants/${tenant.id}/credential-types${path}`,
    { ...init, token },
  );
  if (status !== null && status < 300) {
    revalidatePath("/dashboard", "layout");
    return null;
  }
  return (detail && CODES[detail]) || "unavailable";
}

/**
 * Add a credential type: the trust anchor's to Almena's catalogue, any other
 * account's of its own (when its subscription allows it).
 */
/** The type as typed, read from its form. */
function readType(form: FormData): CredentialTypeState {
  const read = (name: string) => String(form.get(name) ?? "").trim();
  let claims: ClaimDraft[] = [];
  try {
    const parsed: unknown = JSON.parse(read("claims") || "[]");
    if (Array.isArray(parsed)) claims = parsed as ClaimDraft[];
  } catch {}
  return {
    key: read("key"),
    labels: textsFrom(form.get("labels")),
    descriptions: textsFrom(form.get("descriptions")),
    category: read("category"),
    source: read("source"),
    claims,
    issuance: read("issuance") || "almena",
    vct: read("vct"),
    w3c_type: read("w3c_type"),
    mdoc_doctype: read("mdoc_doctype"),
  };
}

/**
 * What to send for `keep` (all but its key), or what is wrong with it. The
 * anchor's are Almena's: in every language, with their standard; an
 * account's own need one language and no standard, and its issuers issue them.
 */
function bodyOf(
  keep: CredentialTypeState,
  anchor: boolean,
): Record<string, unknown> | ErrorKey {
  const written = (texts: Texts | undefined) =>
    anchor ? locales.every((lang) => texts?.[lang]) : hasText(texts);
  if (!written(keep.labels)) return anchor ? "labelsEvery" : "labelsRequired";
  if (!written(keep.descriptions))
    return anchor ? "descriptionsEvery" : "descriptionsRequired";
  if (!keep.category) return "categoryRequired";
  if (anchor && !keep.source) return "sourceRequired";
  if (!keep.claims?.length) return "claimsInvalid";
  const external = anchor && keep.issuance === "external";
  if (external && !keep.vct) return "vctInvalid";
  return {
    labels: keep.labels,
    descriptions: keep.descriptions,
    category: keep.category,
    source: keep.source,
    claims: keep.claims,
    issuance: external ? "external" : "almena",
    // Its own, Almena's, is derived from its key.
    vct: external ? keep.vct : null,
    w3c_type: keep.w3c_type || null,
    mdoc_doctype: keep.mdoc_doctype || null,
  };
}

/**
 * Add a credential type: the trust anchor's to Almena's catalogue, any other
 * account's of its own (when its subscription allows it).
 */
export async function createCredentialType(
  _: CredentialTypeState,
  form: FormData,
): Promise<CredentialTypeState> {
  const keep = readType(form);
  if (!keep.key) return { ...keep, error: "keyRequired" };
  const anchor = (await currentTenant())?.anchor ?? false;
  const body = bodyOf(keep, anchor);
  if (typeof body === "string") return { ...keep, error: body };
  const error = await call("", {
    method: "POST",
    body: { key: keep.key, ...body },
  });
  if (error) return { ...keep, error };
  redirect("/dashboard/credential-types");
}

/**
 * Change one of the account's types; never its key. While something uses it, the
 * API takes new words and optional claims only.
 */
export async function updateCredentialType(
  id: string,
  previous: CredentialTypeState,
  form: FormData,
): Promise<CredentialTypeState> {
  const keep = { ...readType(form), key: previous.key };
  const anchor = (await currentTenant())?.anchor ?? false;
  const body = bodyOf(keep, anchor);
  if (typeof body === "string") return { ...keep, error: body };
  const error = await call(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (error)
    return {
      ...keep,
      error: error === "typeInUse" ? "typeInUseChange" : error,
    };
  redirect("/dashboard/credential-types");
}

/** Delete one of the account's types, while nothing uses it. */
export async function deleteCredentialType(
  id: string,
): Promise<{ error?: ErrorKey }> {
  const error = await call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return error ? { error } : {};
}
