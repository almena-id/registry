"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getLocale } from "@/app/i18n/server";
import { api, currentTenant, sessionCookie } from "./api";

/** Why it was not published: the API's code, when it gave one. */
export type PublishState = { error?: string | null };

/**
 * Publish an issuer, verifier or mediator of a tenant whose signing flow is
 * `none`: the platform endorses it at once, no wallet asked; then back to it.
 */
export async function publishNow(
  section: "issuers" | "verifiers" | "mediators",
  id: string,
): Promise<PublishState> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: null };
  const { data, detail } = await api<{ status?: string }>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}/publish`,
    { method: "POST", body: { locale: await getLocale() }, token },
  );
  // A wallet request instead means the flow changed meanwhile: not done here.
  if (data?.status !== "signed") return { error: detail };
  redirect(`/dashboard/${section}/${id}?signed=1`);
}
