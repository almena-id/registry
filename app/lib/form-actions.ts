"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";
import { fetchTenantCatalogue } from "./field-catalog";
import {
  toCredential,
  toField,
  type CredentialDraft,
  type CredentialProblem,
  type FieldDraft,
  type FieldProblem,
} from "./form-fields";
import { hasText, longest, onlyIn, textsFrom, type Texts } from "./texts";

type ErrorKey = keyof Dictionary["dashboard"]["forms"]["errors"];

export type FormState = {
  name?: Texts;
  description?: Texts;
  errors?: {
    name?: ErrorKey;
    description?: ErrorKey;
    form?: ErrorKey;
    /** The first field that does not hold, by its draft's id. */
    field?: { id: string; problem: FieldProblem };
    /** The first credential request that does not hold, by its draft's id. */
    credential?: { id: string; problem: CredentialProblem };
  };
};

/** The API's refusals about one of the fields, as the builder words them. */
const FIELD_CODES: Record<string, FieldProblem> = {
  field_unknown: "fieldUnknown",
  field_rename_invalid: "keyInvalid",
  field_key_invalid: "keyInvalid",
  field_key_duplicate: "keyDuplicate",
  field_narrow_invalid: "narrowInvalid",
};

/** The API's refusals about one of the credentials asked for. */
const CREDENTIAL_CODES: Record<string, CredentialProblem> = {
  credential_key_invalid: "credentialKeyInvalid",
  credential_key_duplicate: "credentialKeyDuplicate",
  credential_type_duplicate: "credentialTypeDuplicate",
  credential_claims_invalid: "claimsInvalid",
  credential_trust_invalid: "trustInvalid",
};

/** The API's refusals about the form as a whole. */
const CODES: Record<string, ErrorKey> = {
  fields_required: "fieldsRequired",
  form_in_use: "inUse",
  form_not_found: "gone",
};

function drafts<T>(form: FormData, name: string): T[] {
  try {
    const parsed: unknown = JSON.parse(String(form.get(name) ?? "[]"));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** A new form. */
export async function createForm(
  state: FormState,
  form: FormData,
): Promise<FormState> {
  return saveForm(null, state, form);
}

/** A form changed, the whole of it; in use, it may only take more. */
export async function updateForm(
  id: string,
  state: FormState,
  form: FormData,
): Promise<FormState> {
  return saveForm(id, state, form);
}

async function saveForm(
  id: string | null,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  // Written in the account's languages only: what was in another goes now.
  const languages = (await currentTenant())?.languages;
  const name = onlyIn(textsFrom(form.get("name")), languages);
  const description = onlyIn(textsFrom(form.get("description")), languages);
  const keep = { name, description };
  const errors: FormState["errors"] = {};
  if (!hasText(name)) errors.name = "nameRequired";
  else if (longest(name) > 200) errors.name = "nameLong";
  if (longest(description) > 2000) errors.description = "descriptionLong";

  const written = drafts<FieldDraft>(form, "fields").map((draft) => ({
    ...draft,
    help: onlyIn(draft.help, languages),
  }));
  const asked = drafts<CredentialDraft>(form, "credentials").map((draft) => ({
    ...draft,
    purpose: onlyIn(draft.purpose, languages),
  }));
  if (!written.length && !asked.length) errors.form ??= "fieldsRequired";
  if (Object.keys(errors).length) return { ...keep, errors };

  const catalogue = await fetchTenantCatalogue();
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!catalogue || !token || !tenant)
    return { ...keep, errors: { form: "unavailable" } };
  const path = `/tenants/${tenant.id}/forms`;
  const { status, detail, failure } = await api(
    id ? `${path}/${encodeURIComponent(id)}` : path,
    {
      method: id ? "PUT" : "POST",
      token,
      body: {
        name,
        description: hasText(description) ? description : null,
        // In the drafts' order: the API names the one that does not hold by it.
        fields: written.map((draft) => toField(draft, catalogue)),
        credentials: asked.map(toCredential),
      },
    },
  );
  if (status === null || status >= 300) {
    const refused = (failure ?? {}) as {
      field?: number;
      credential?: number;
    };
    const code = detail ?? "";
    const field = refused.field !== undefined && written[refused.field];
    if (field && code === "form_in_use")
      return {
        ...keep,
        errors: { field: { id: field.id, problem: "inUseField" } },
      };
    if (field && FIELD_CODES[code])
      return {
        ...keep,
        errors: { field: { id: field.id, problem: FIELD_CODES[code] } },
      };
    const asking =
      refused.credential !== undefined && asked[refused.credential];
    if (asking && code === "form_in_use")
      return {
        ...keep,
        errors: {
          credential: { id: asking.id, problem: "inUseCredential" },
        },
      };
    if (asking && CREDENTIAL_CODES[code])
      return {
        ...keep,
        errors: {
          credential: { id: asking.id, problem: CREDENTIAL_CODES[code] },
        },
      };
    return { ...keep, errors: { form: CODES[code] ?? "unavailable" } };
  }
  revalidatePath("/dashboard", "layout");
  redirect(
    id ? `/dashboard/forms/${encodeURIComponent(id)}` : "/dashboard/forms",
  );
}

/** Deletes a form no offer puts and nothing was made with; why not, otherwise. */
export async function deleteForm(id: string): Promise<{ error?: ErrorKey }> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: "unavailable" };
  const { status, detail } = await api(
    `/tenants/${tenant.id}/forms/${encodeURIComponent(id)}`,
    { method: "DELETE", token },
  );
  if (status !== 204) return { error: CODES[detail ?? ""] ?? "unavailable" };
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/forms");
}
