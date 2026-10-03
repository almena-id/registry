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

  const written = drafts<FieldDraft>(form, "fields");
  const asked = drafts<CredentialDraft>(form, "credentials");
  if (!written.length && !asked.length) errors.form ??= "fieldsRequired";
  if (Object.keys(errors).length) return { ...keep, errors };

  const catalogue = await fetchTenantCatalogue();
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!catalogue || !token || !tenant)
    return { ...keep, errors: { form: "unavailable" } };
  const { status, detail, failure } = await api(`/tenants/${tenant.id}/forms`, {
    method: "POST",
    token,
    body: {
      name,
      description: hasText(description) ? description : null,
      // In the drafts' order: the API names the one that does not hold by it.
      fields: written.map((draft) => toField(draft, catalogue)),
      credentials: asked.map(toCredential),
    },
  });
  if (status === null || status >= 300) {
    const refused = (failure ?? {}) as {
      code?: string;
      field?: number;
      credential?: number;
    };
    const code = refused.code ?? detail ?? "";
    const field = refused.field !== undefined && written[refused.field];
    if (field && FIELD_CODES[code])
      return {
        ...keep,
        errors: { field: { id: field.id, problem: FIELD_CODES[code] } },
      };
    const asking =
      refused.credential !== undefined && asked[refused.credential];
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
  redirect("/dashboard/forms");
}
