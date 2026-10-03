"use server";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";

/** One credential the form asks for, as the API checked what was presented. */
export type VerifiedCredential = {
  key: string;
  presented: boolean;
  verified: boolean;
  query: string | null;
  format: string | null;
  issuer: string | null;
  claims: Record<string, unknown>;
  fills: Record<string, unknown>;
  problems: string[];
};

export type VerifyState = {
  vpToken?: string;
  nonce?: string;
  audience?: string;
  result?: { verified: boolean; credentials: VerifiedCredential[] };
  errors?: {
    vpToken?: "vpTokenRequired" | "vpTokenInvalid";
    nonce?: "nonceRequired";
    audience?: "audienceRequired";
    form?: "unavailable" | "refused";
  };
};

/**
 * Checks an OpenID4VP `vp_token` against a form, as the API does for any
 * verifier: the result says, credential by credential, whether it holds.
 */
export async function verifyPresentation(
  formId: string,
  _: VerifyState,
  form: FormData,
): Promise<VerifyState> {
  const vpToken = String(form.get("vp_token") ?? "").trim();
  const nonce = String(form.get("nonce") ?? "").trim();
  const audience = String(form.get("audience") ?? "").trim();
  const keep = { vpToken, nonce, audience };
  const errors: VerifyState["errors"] = {};
  let parsed: unknown = null;
  if (!vpToken) errors.vpToken = "vpTokenRequired";
  else {
    try {
      parsed = JSON.parse(vpToken);
    } catch {
      errors.vpToken = "vpTokenInvalid";
    }
  }
  if (!nonce) errors.nonce = "nonceRequired";
  if (!audience) errors.audience = "audienceRequired";
  if (Object.keys(errors).length) return { ...keep, errors };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const { status, data } = await api<VerifyState["result"]>(
    `/tenants/${tenant.id}/forms/${encodeURIComponent(formId)}/verify`,
    { method: "POST", body: { vp_token: parsed, nonce, audience }, token },
  );
  if (!data)
    return {
      ...keep,
      errors:
        status === 422
          ? { vpToken: "vpTokenInvalid" }
          : { form: status === null ? "unavailable" : "refused" },
    };
  return { ...keep, result: data };
}
