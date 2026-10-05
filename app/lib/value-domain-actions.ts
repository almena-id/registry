"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { locales, type Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { textsFrom, type Texts } from "./texts";

type ErrorKey = keyof Dictionary["dashboard"]["catalogue"]["domains"]["errors"];

/** A code as typed: its value (text), its labels and, for files, a media type. */
export type CodeDraft = { value: string; labels: Texts; media_type?: string };

export type DomainState = {
  key?: string;
  labels?: Texts;
  source?: string;
  /** `text` or `number`: what all its values are. */
  kind?: string;
  codes?: CodeDraft[];
  error?: ErrorKey;
};

const CODES: Record<string, ErrorKey> = {
  key_invalid: "keyInvalid",
  key_exists: "keyExists",
  labels_required: "labelsRequired",
  source_required: "sourceRequired",
  codes_invalid: "codesInvalid",
  media_type_invalid: "mediaTypeInvalid",
  domain_in_use: "inUse",
  domain_not_found: "unavailable",
  anchor_only: "unavailable",
};

async function call(
  path: string,
  init: { method: string; body?: unknown },
): Promise<ErrorKey | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant?.anchor) return "unavailable";
  const { status, detail } = await api(
    `/tenants/${tenant.id}/value-domains${path}`,
    { ...init, token },
  );
  if (status !== null && status < 300) {
    revalidatePath("/dashboard", "layout");
    return null;
  }
  return (detail && CODES[detail]) || "unavailable";
}

function read(form: FormData): DomainState {
  let codes: CodeDraft[] = [];
  try {
    const parsed: unknown = JSON.parse(String(form.get("codes") ?? "[]"));
    if (Array.isArray(parsed)) codes = parsed as CodeDraft[];
  } catch {}
  return {
    key: String(form.get("key") ?? "").trim(),
    labels: textsFrom(form.get("labels")),
    source: String(form.get("source") ?? "").trim(),
    kind: String(form.get("kind") ?? "text"),
    codes,
  };
}

const every = (texts: Texts | undefined) =>
  locales.every((lang) => texts?.[lang]?.trim());

/** The codes to send, or what is wrong with them. */
function codesOf(keep: DomainState): unknown[] | ErrorKey {
  const rows = (keep.codes ?? []).filter((code) => code.value.trim());
  if (!rows.length) return "codesInvalid";
  const numbers = keep.kind === "number";
  if (numbers && rows.some((code) => !/^-?\d+$/.test(code.value.trim())))
    return "numbersInvalid";
  if (rows.some((code) => !every(code.labels))) return "codesInvalid";
  return rows.map((code) => ({
    value: numbers ? Number(code.value.trim()) : code.value.trim(),
    labels: code.labels,
    ...(code.media_type?.trim() ? { media_type: code.media_type.trim() } : {}),
  }));
}

/** The trust anchor adds a value domain to Almena's catalogue. */
export async function createDomain(
  _: DomainState,
  form: FormData,
): Promise<DomainState> {
  const keep = read(form);
  if (!keep.key) return { ...keep, error: "keyRequired" };
  if (!every(keep.labels)) return { ...keep, error: "labelsRequired" };
  if (!keep.source) return { ...keep, error: "sourceRequired" };
  const codes = codesOf(keep);
  if (typeof codes === "string") return { ...keep, error: codes };
  const error = await call("", {
    method: "POST",
    body: { key: keep.key, labels: keep.labels, source: keep.source, codes },
  });
  if (error) return { ...keep, error };
  redirect("/dashboard/value-lists");
}

/**
 * The trust anchor changes one; never its key. While a field draws on it, the
 * API takes only what keeps every code it had.
 */
export async function updateDomain(
  id: string,
  previous: DomainState,
  form: FormData,
): Promise<DomainState> {
  const keep = { ...read(form), key: previous.key };
  if (!every(keep.labels)) return { ...keep, error: "labelsRequired" };
  if (!keep.source) return { ...keep, error: "sourceRequired" };
  const codes = codesOf(keep);
  if (typeof codes === "string") return { ...keep, error: codes };
  const error = await call(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { labels: keep.labels, source: keep.source, codes },
  });
  if (error) return { ...keep, error };
  redirect("/dashboard/value-lists");
}

/** The trust anchor deletes one no field draws on. */
export async function deleteDomain(id: string): Promise<{ error?: ErrorKey }> {
  const error = await call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return error ? { error } : {};
}
