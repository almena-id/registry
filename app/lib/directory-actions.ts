"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenants, sessionCookie } from "./api";
import { fetchPage } from "./directory";
import { hasDescription, isSection, type Page } from "./directory-types";

/** The next page, for the list as it is scrolled. */
export async function loadMore(
  section: string,
  cursor: string,
): Promise<Page | null> {
  if (!isSection(section)) return null;
  return fetchPage(section, cursor);
}

type ErrorKey = keyof Dictionary["dashboard"]["items"]["errors"];

export type CreateState = {
  name?: string;
  description?: string;
  /** Issuers and verifiers: `new`, or `existing` with `identityId`. */
  identityMode?: "new" | "existing";
  identityId?: string;
  errors?: {
    name?: ErrorKey;
    description?: ErrorKey;
    identity?: ErrorKey;
    form?: ErrorKey;
  };
};

export async function createItem(
  section: string,
  _: CreateState,
  form: FormData,
): Promise<CreateState> {
  if (!isSection(section)) return { errors: { form: "unavailable" } };
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const identityMode =
    form.get("identity_mode") === "existing" ? "existing" : "new";
  const identityId = String(form.get("identity_id") ?? "");
  const keep = { name, description, identityMode, identityId } as const;
  const errors: CreateState["errors"] = {};
  if (!name) errors.name = "nameRequired";
  else if (name.length > 200) errors.name = "nameLong";
  if (description.length > 2000) errors.description = "descriptionLong";
  if (hasDescription(section) && identityMode === "existing" && !identityId) {
    errors.identity = "identityRequired";
  }
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  // Issuers and verifiers act as an identity: a chosen one, or (left out) a
  // new one the API creates with the same name.
  const body = hasDescription(section)
    ? {
        name,
        description: description || null,
        identity_id: identityMode === "existing" ? identityId : null,
      }
    : { name };
  const { data, detail } = await api(`/tenants/${tenant.id}/${section}`, {
    method: "POST",
    body,
    token,
  });
  if (!data) {
    if (detail === "identity_not_found") {
      return { ...keep, errors: { identity: "identityNotFound" } };
    }
    return { ...keep, errors: { form: "unavailable" } };
  }
  redirect(`/dashboard/${section}`);
}
