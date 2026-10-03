import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";
import type { CredentialRequest, FormField } from "./form-fields";
import type { Texts } from "./texts";

/** A form the tenant puts to people, with its fields in order. */
export type Form = {
  id: string;
  slug: string;
  name: Texts;
  description: Texts | null;
  fields: FormField[];
  credentials: CredentialRequest[];
  created_at: string;
  updated_at: string;
};

/** The current tenant's forms, newest first; `null` when the API cannot be reached. */
export async function fetchForms(): Promise<Form[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<Form[]>(`/tenants/${tenant.id}/forms`, { token });
  return data;
}

async function formCall<T>(id: string, path = ""): Promise<T | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<T>(
    `/tenants/${tenant.id}/forms/${encodeURIComponent(id)}${path}`,
    { token },
  );
  return data;
}

/** One of the current tenant's forms; `null` when it is not, or unreachable. */
export const fetchForm = (id: string) => formCall<Form>(id);

/** The OpenID4VP DCQL query of the credentials a form asks for. */
export const fetchFormDcql = (id: string) =>
  formCall<Record<string, unknown>>(id, "/dcql");

/** The JSON Schema a form's answers meet. */
export const fetchFormSchema = (id: string) =>
  formCall<Record<string, unknown>>(id, "/schema");
