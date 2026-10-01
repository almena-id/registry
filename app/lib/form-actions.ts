"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { fetchTenantCatalogue } from "./field-catalog";
import {
  CUSTOM,
  toCredential,
  toField,
  type CredentialDraft,
  type CredentialProblem,
  type FieldDraft,
  type FieldProblem,
  type FormField,
} from "./form-fields";
import { hasText, longest, textsFrom, type Texts } from "./texts";

type ErrorKey = keyof Dictionary["dashboard"]["forms"]["errors"];

export type FormState = {
  name?: Texts;
  description?: Texts;
  errors?: {
    name?: ErrorKey;
    description?: ErrorKey;
    form?: ErrorKey;
    /** The first field that does not hold, by its draft's id. */
    field?: { id: string; problem: FieldProblem | "keyDuplicate" };
    /** The first credential request that does not hold, by its draft's id. */
    credential?: { id: string; problem: CredentialProblem };
  };
};

const CODES: Record<string, ErrorKey> = {
  fields_required: "fieldsRequired",
  field_unknown: "fieldUnknown",
  field_rename_invalid: "keyInvalid",
  field_key_invalid: "keyInvalid",
  field_key_duplicate: "keyDuplicate",
  field_narrow_invalid: "narrowInvalid",
  credential_unknown: "unavailable",
  credential_key_invalid: "credentialKeyInvalid",
  credential_key_duplicate: "credentialKeyDuplicate",
  credential_claims_invalid: "claimsInvalid",
  credential_trust_invalid: "trustInvalid",
};

function drafts<T>(form: FormData, name: string): T[] {
  try {
    const parsed: unknown = JSON.parse(String(form.get(name) ?? "[]"));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function createForm(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const name = textsFrom(form.get("name"));
  const description = textsFrom(form.get("description"));
  const keep = { name, description };
  const errors: FormState["errors"] = {};
  if (!hasText(name)) errors.name = "nameRequired";
  else if (longest(name) > 200) errors.name = "nameLong";
  if (longest(description) > 2000) errors.description = "descriptionLong";

  const catalogue = await fetchTenantCatalogue();
  if (!catalogue) return { ...keep, errors: { form: "unavailable" } };
  const fields: FormField[] = [];
  const keys = new Set<string>();
  const written = drafts<FieldDraft>(form, "fields");
  for (const draft of written) {
    const result = toField(draft, catalogue);
    if ("problem" in result) {
      errors.field = { id: draft.id, problem: result.problem };
      break;
    }
    const key = result.field.as ?? result.field.ref.replace(CUSTOM, "");
    if (keys.has(key)) {
      errors.field = { id: draft.id, problem: "keyDuplicate" };
      break;
    }
    keys.add(key);
    fields.push(result.field);
  }
  const credentials: Record<string, unknown>[] = [];
  const credentialKeys = new Set<string>();
  const asked = drafts<CredentialDraft>(form, "credentials");
  for (const draft of asked) {
    const result = toCredential(draft);
    if ("problem" in result) {
      errors.credential = { id: draft.id, problem: result.problem };
      break;
    }
    const key = String(result.request.key);
    if (credentialKeys.has(key)) {
      errors.credential = { id: draft.id, problem: "credentialKeyDuplicate" };
      break;
    }
    credentialKeys.add(key);
    credentials.push(result.request);
  }
  if (!written.length && !asked.length) errors.form ??= "fieldsRequired";
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const { status, detail } = await api(`/tenants/${tenant.id}/forms`, {
    method: "POST",
    token,
    body: {
      name,
      description: hasText(description) ? description : null,
      fields,
      credentials,
    },
  });
  if (status === null || status >= 300)
    return {
      ...keep,
      errors: { form: (detail && CODES[detail]) || "unavailable" },
    };
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/forms");
}
