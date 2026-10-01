"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { api, currentTenant, sessionCookie } from "./api";

export type IssuerCredentialsState = {
  saved?: boolean;
  error?: "invalid" | "formInvalid" | "unavailable";
};

/** Declare the credential types an issuer grants (the ticked `types`) and
 * the form for each it offers (`form.{type}`). */
export async function saveIssuerCredentialTypes(
  issuerId: string,
  _: IssuerCredentialsState,
  form: FormData,
): Promise<IssuerCredentialsState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: "unavailable" };
  const { status, detail } = await api(
    `/tenants/${tenant.id}/issuers/${encodeURIComponent(issuerId)}/credential-types`,
    {
      method: "PUT",
      token,
      body: {
        types: form.getAll("types").map(String),
        forms: Object.fromEntries(
          form
            .getAll("types")
            .map(String)
            .map((type) => [type, String(form.get(`form.${type}`) ?? "")])
            .filter(([, id]) => id),
        ),
      },
    },
  );
  if (status === null || status >= 300)
    return {
      error:
        detail === "credential_type_invalid"
          ? "invalid"
          : detail === "request_form_invalid"
            ? "formInvalid"
            : "unavailable",
    };
  revalidatePath(`/dashboard/issuers/${issuerId}`, "layout");
  return { saved: true };
}
