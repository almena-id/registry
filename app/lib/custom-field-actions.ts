"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { cleanTexts, hasText, textsFrom, type Texts } from "./texts";

type ErrorKey = keyof Dictionary["dashboard"]["catalogue"]["errors"];

/** A list option as typed: its value and its label by language. */
export type OptionDraft = { value: string; labels: Texts };

export type CustomFieldState = {
  key?: string;
  type?: string;
  labels?: Texts;
  max_length?: string;
  pattern?: string;
  options?: OptionDraft[];
  formats?: string[];
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

export async function createCustomField(
  _: CustomFieldState,
  form: FormData,
): Promise<CustomFieldState> {
  const read = (name: string) => String(form.get(name) ?? "").trim();
  let options: OptionDraft[] = [];
  try {
    const parsed: unknown = JSON.parse(read("options") || "[]");
    if (Array.isArray(parsed)) options = parsed as OptionDraft[];
  } catch {}
  const keep: CustomFieldState = {
    key: read("key"),
    type: read("type"),
    labels: textsFrom(form.get("labels")),
    max_length: read("max_length"),
    pattern: read("pattern"),
    options,
    formats: form.getAll("formats").map(String),
  };
  if (!keep.key) return { ...keep, error: "keyRequired" };
  if (!hasText(keep.labels)) return { ...keep, error: "labelsRequired" };

  const body: Record<string, unknown> = {
    key: keep.key,
    type: keep.type,
    labels: keep.labels,
  };
  if (keep.type === "text") {
    if (keep.max_length) {
      const length = Number(keep.max_length);
      if (!Number.isInteger(length) || length < 1)
        return { ...keep, error: "lengthInvalid" };
      body.max_length = length;
    }
    if (keep.pattern) body.pattern = keep.pattern;
  }
  if (keep.type === "code" || keep.type === "codes")
    body.options = options
      .filter((option) => option.value.trim())
      .map((option) => ({
        value: option.value.trim(),
        labels: cleanTexts(option.labels),
      }));
  if (keep.type === "file") body.formats = keep.formats;

  const error = await call("", { method: "POST", body });
  if (error) return { ...keep, error };
  redirect("/dashboard/catalogue");
}

export async function deleteCustomField(
  id: string,
): Promise<{ error?: ErrorKey }> {
  const error = await call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return error ? { error } : {};
}
