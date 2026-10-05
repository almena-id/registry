"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { locales, type Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { cleanTexts, hasText, textsFrom, type Texts } from "./texts";

type ErrorKey = keyof Dictionary["dashboard"]["catalogue"]["errors"];

/** A list option as typed: its value and its label by language. */
export type OptionDraft = { value: string; labels: Texts };

/** One part of a group, as typed (the trust anchor's groups). */
export type PartDraft = {
  key: string;
  required: boolean;
  type: string;
  labels: Texts;
  max_length?: string;
  /** `code`/`codes`: the value list it draws on. */
  domain?: string;
  /** The editor's own handle on it, kept as parts move; never sent. */
  uid?: string;
};

export type CustomFieldState = {
  key?: string;
  type?: string;
  labels?: Texts;
  max_length?: string;
  pattern?: string;
  options?: OptionDraft[];
  formats?: string[];
  /** `code`/`codes`: one of the anchor's value lists, in place of options. */
  domain?: string;
  /** `group`: its parts, in order. */
  parts?: PartDraft[];
  /** The trust anchor's fields: their category and standard. */
  category?: string;
  source?: string;
  error?: ErrorKey;
};

const CODES: Record<string, ErrorKey> = {
  key_invalid: "keyInvalid",
  key_reserved: "keyReserved",
  key_exists: "keyExists",
  labels_required: "labelsRequired",
  constraint_invalid: "unavailable",
  pattern_invalid: "patternInvalid",
  options_invalid: "optionsInvalid",
  formats_invalid: "formatsInvalid",
  field_in_use: "inUse",
  category_invalid: "categoryRequired",
  source_required: "sourceRequired",
  anchor_only: "unavailable",
  subscription_required: "subscriptionRequired",
  domain_invalid: "domainInvalid",
  parts_invalid: "partsInvalid",
};

async function call(
  path: string,
  init: { method: string; body?: unknown },
): Promise<ErrorKey | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return "unavailable";
  const { status, detail } = await api(`/tenants/${tenant.id}/fields${path}`, {
    ...init,
    token,
  });
  if (status !== null && status < 300) {
    revalidatePath("/dashboard", "layout");
    return null;
  }
  return (detail && CODES[detail]) || "unavailable";
}

/** The field as typed, read from its form. */
function readField(form: FormData): CustomFieldState {
  const read = (name: string) => String(form.get(name) ?? "").trim();
  let options: OptionDraft[] = [];
  let parts: PartDraft[] = [];
  try {
    const parsed: unknown = JSON.parse(read("options") || "[]");
    if (Array.isArray(parsed)) options = parsed as OptionDraft[];
    const listed: unknown = JSON.parse(read("parts") || "[]");
    if (Array.isArray(listed)) parts = listed as PartDraft[];
  } catch {}
  return {
    key: read("key"),
    type: read("type"),
    labels: textsFrom(form.get("labels")),
    max_length: read("max_length"),
    pattern: read("pattern"),
    options,
    formats: form.getAll("formats").map(String),
    domain: read("domain"),
    parts,
    category: read("category"),
    source: read("source"),
  };
}

/** A group's parts to send, or what is wrong with them. */
function partsOf(parts: PartDraft[]): unknown[] | ErrorKey {
  const rows = parts.filter((part) => part.key.trim());
  if (!rows.length) return "partsInvalid";
  const out: unknown[] = [];
  for (const part of rows) {
    if (locales.some((lang) => !part.labels[lang]?.trim()))
      return "partsInvalid";
    const entry: Record<string, unknown> = {
      key: part.key.trim(),
      required: part.required,
      type: part.type,
      labels: cleanTexts(part.labels),
    };
    if (part.type === "text" && part.max_length?.trim()) {
      const length = Number(part.max_length);
      if (!Number.isInteger(length) || length < 1) return "lengthInvalid";
      entry.max_length = length;
    }
    if (part.type === "code" || part.type === "codes") {
      if (!part.domain) return "partsInvalid";
      entry.domain = part.domain;
    }
    out.push(entry);
  }
  return out;
}

/** What to send for `keep`, or what is wrong with it. */
function bodyOf(
  keep: CustomFieldState,
  anchor: boolean,
): Record<string, unknown> | ErrorKey {
  if (!hasText(keep.labels)) return "labelsRequired";
  // The anchor's are everyone's: named in every language, filed and sourced.
  if (anchor && locales.some((lang) => !keep.labels?.[lang]))
    return "labelsEvery";
  if (anchor && !keep.category) return "categoryRequired";
  if (anchor && !keep.source) return "sourceRequired";

  const body: Record<string, unknown> = { labels: keep.labels };
  if (anchor) {
    body.category = keep.category;
    body.source = keep.source;
  }
  body.type = keep.type;
  if (keep.type === "group") {
    const parts = partsOf(keep.parts ?? []);
    if (typeof parts === "string") return parts;
    body.parts = parts;
  }
  if (keep.type === "text") {
    if (keep.max_length) {
      const length = Number(keep.max_length);
      if (!Number.isInteger(length) || length < 1) return "lengthInvalid";
      body.max_length = length;
    }
    if (keep.pattern) body.pattern = keep.pattern;
  }
  if ((keep.type === "code" || keep.type === "codes") && keep.domain)
    body.domain = keep.domain;
  else if (keep.type === "code" || keep.type === "codes")
    body.options = (keep.options ?? [])
      .filter((option) => option.value.trim())
      .map((option) => ({
        value: option.value.trim(),
        labels: cleanTexts(option.labels),
      }));
  if (keep.type === "file") body.formats = keep.formats;
  return body;
}

export async function createCustomField(
  _: CustomFieldState,
  form: FormData,
): Promise<CustomFieldState> {
  const keep = readField(form);
  if (!keep.key) return { ...keep, error: "keyRequired" };
  const anchor = (await currentTenant())?.anchor ?? false;
  const body = bodyOf(keep, anchor);
  if (typeof body === "string") return { ...keep, error: body };
  const error = await call("", {
    method: "POST",
    body: { key: keep.key, ...body },
  });
  if (error) return { ...keep, error };
  redirect("/dashboard/fields");
}

/**
 * Change one of the account's fields (the anchor's: Almena's); never its key.
 * While something uses it, the API takes only changes that turn away nothing
 * it took.
 */
export async function updateCustomField(
  id: string,
  previous: CustomFieldState,
  form: FormData,
): Promise<CustomFieldState> {
  const keep = { ...readField(form), key: previous.key };
  const anchor = (await currentTenant())?.anchor ?? false;
  const body = bodyOf(keep, anchor);
  if (typeof body === "string") return { ...keep, error: body };
  const error = await call(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (error)
    return { ...keep, error: error === "inUse" ? "inUseChange" : error };
  redirect("/dashboard/fields");
}

export async function deleteCustomField(
  id: string,
): Promise<{ error?: ErrorKey }> {
  const error = await call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return error ? { error } : {};
}
