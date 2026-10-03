"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, currentTenant, sessionCookie } from "./api";

export type DecisionState = { error?: "already_decided" | "unavailable" };

/** The issuer's members: accept or reject a received application. */
export async function decideApplication(
  id: string,
  _: DecisionState,
  form: FormData,
): Promise<DecisionState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: "unavailable" };
  const { status, detail } = await api(
    `/tenants/${tenant.id}/applications/${encodeURIComponent(id)}/decision`,
    {
      method: "POST",
      token,
      body: {
        decision: String(form.get("decision")),
        note: String(form.get("note") ?? "").trim() || null,
      },
    },
  );
  if (status === null || status >= 300)
    return {
      error: detail === "already_decided" ? "already_decided" : "unavailable",
    };
  revalidatePath("/dashboard/applications", "layout");
  return {};
}

export type IssuanceResult =
  { ok: true } | { ok: false; errors: Record<string, string>; error?: string };

/**
 * Settle an accepted application's credential — its claims and until when —
 * then go to sign it.
 */
export async function saveIssuance(
  id: string,
  claims: Record<string, unknown>,
  validUntil: string,
): Promise<IssuanceResult> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ok: false, errors: {}, error: "unavailable" };
  const { status, detail, failure } = await api(
    `/tenants/${tenant.id}/applications/${encodeURIComponent(id)}/issuance`,
    { method: "PUT", token, body: { claims, valid_until: validUntil } },
  );
  if (status === null || status >= 300) {
    const errors =
      failure && typeof failure === "object" && "errors" in failure
        ? ((failure as { errors: Record<string, string> }).errors ?? {})
        : {};
    return {
      ok: false,
      errors,
      error:
        detail ??
        (Object.keys(errors).length ? "claims_invalid" : "unavailable"),
    };
  }
  redirect(`/dashboard/applications/${encodeURIComponent(id)}/issue`);
}
