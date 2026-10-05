"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { locales, type Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { segmentOf } from "@/app/dashboard/(templates)/categories/kinds";
import { textsFrom, type Texts } from "./texts";

type ErrorKey =
  keyof Dictionary["dashboard"]["catalogue"]["categories"]["errors"];

export type CategoryState = {
  /** `field` or `credential`: fixed by the screen it is made on. */
  kind?: string;
  key?: string;
  labels?: Texts;
  error?: ErrorKey;
};

const CODES: Record<string, ErrorKey> = {
  key_invalid: "keyInvalid",
  key_exists: "keyExists",
  labels_required: "labelsRequired",
  category_in_use: "inUse",
  category_not_found: "unavailable",
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
    `/tenants/${tenant.id}/categories${path}`,
    { ...init, token },
  );
  if (status !== null && status < 300) {
    revalidatePath("/dashboard", "layout");
    return null;
  }
  return (detail && CODES[detail]) || "unavailable";
}

function read(form: FormData): CategoryState {
  return {
    kind: String(form.get("kind") ?? "").trim(),
    key: String(form.get("key") ?? "").trim(),
    labels: textsFrom(form.get("labels")),
  };
}

const named = (labels: Texts | undefined) =>
  locales.every((lang) => labels?.[lang]);

/** The trust anchor adds a category: for fields or for credential types. */
export async function createCategory(
  _: CategoryState,
  form: FormData,
): Promise<CategoryState> {
  const keep = read(form);
  if (!keep.key) return { ...keep, error: "keyRequired" };
  if (!named(keep.labels)) return { ...keep, error: "labelsRequired" };
  const error = await call("", {
    method: "POST",
    body: { kind: keep.kind, key: keep.key, labels: keep.labels },
  });
  if (error) return { ...keep, error };
  redirect(`/dashboard/categories/${segmentOf(keep.kind)}`);
}

/** The trust anchor renames one; its kind and key never change. */
export async function updateCategory(
  id: string,
  previous: CategoryState,
  form: FormData,
): Promise<CategoryState> {
  const keep = { ...previous, labels: textsFrom(form.get("labels")) };
  if (!named(keep.labels)) return { ...keep, error: "labelsRequired" };
  const error = await call(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { labels: keep.labels },
  });
  if (error) return { ...keep, error };
  redirect(`/dashboard/categories/${segmentOf(keep.kind)}`);
}

/** The trust anchor deletes one nothing is filed under. */
export async function deleteCategory(
  id: string,
): Promise<{ error?: ErrorKey }> {
  const error = await call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return error ? { error } : {};
}
