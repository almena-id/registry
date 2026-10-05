"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isLocale, locales, type Dictionary } from "@/app/i18n/config";
import {
  api,
  currentTenant,
  currentTenants,
  sessionCookie,
  tenantCookie,
} from "./api";
import { signingFlows, type SigningFlow } from "./signing-flows";
import type { TenantDetail } from "./tenant";

type ErrorKey = keyof Dictionary["dashboard"]["tenant"]["errors"];

export type TenantState = {
  name?: string;
  /** The chosen mediator's id; empty for none. */
  mediator?: string;
  /** The languages it works in, of the platform's. */
  languages?: string[];
  saved?: boolean;
  errors?: {
    name?: ErrorKey;
    mediator?: ErrorKey;
    languages?: ErrorKey;
    form?: ErrorKey;
  };
};

export async function saveTenant(
  _: TenantState,
  form: FormData,
): Promise<TenantState> {
  const name = String(form.get("name") ?? "").trim();
  const mediator = String(form.get("mediator") ?? "").trim();
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  // The trust anchor's are all of them, and not sent.
  const ticked = form.getAll("languages").map(String).filter(isLocale);
  const languages = tenant?.anchor
    ? [...locales]
    : locales.filter((lang) => ticked.includes(lang));
  const keep = { name, mediator, languages };
  if (!name) return { ...keep, errors: { name: "nameRequired" } };
  if (name.length > 200) return { ...keep, errors: { name: "nameLong" } };
  if (!languages.length)
    return { ...keep, errors: { languages: "languagesRequired" } };

  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const { status, data, detail } = await api<TenantDetail>(
    `/tenants/${tenant.id}`,
    {
      method: "PATCH",
      body: {
        name,
        mediator_id: mediator || null,
        ...(tenant.anchor ? {} : { languages }),
      },
      token,
    },
  );
  if (!data) {
    if (detail === "name_required")
      return { ...keep, errors: { name: "nameRequired" } };
    if (detail === "mediator_not_found")
      return { ...keep, errors: { mediator: "mediatorNotFound" } };
    if (detail === "languages_invalid" || detail === "languages_anchor")
      return { ...keep, errors: { languages: "languagesRequired" } };
    if (status === 403) return { ...keep, errors: { form: "notAdmin" } };
    return { ...keep, errors: { form: "unavailable" } };
  }
  // The header shows the tenant's name.
  revalidatePath("/dashboard", "layout");
  return {
    name: data.name ?? "",
    mediator: data.mediator?.id ?? "",
    languages: data.languages,
    saved: true,
  };
}

export type SigningFlowState = {
  signingFlow: SigningFlow;
  /** `single_user`: the member who signs; empty for none yet. */
  signer: string;
  saved?: boolean;
  error?: ErrorKey;
  signerError?: ErrorKey;
};

/**
 * The tenant's signing flow, on its own tab: only a flow the portal knows is
 * sent, and a signer only with the flow that names one.
 */
export async function saveSigningFlow(
  state: SigningFlowState,
  form: FormData,
): Promise<SigningFlowState> {
  const asked = String(form.get("signingFlow") ?? "");
  const signingFlow = signingFlows.find((flow) => flow === asked);
  if (!signingFlow)
    return { signingFlow: state.signingFlow, signer: state.signer };
  const signer =
    signingFlow === "single_user" ? String(form.get("signer") ?? "") : "";
  const keep = { signingFlow, signer };
  if (signingFlow === "single_user" && !signer)
    return { ...keep, signerError: "signerRequired" };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { ...keep, error: "unavailable" };
  const { status, data, detail } = await api<TenantDetail>(
    `/tenants/${tenant.id}`,
    {
      method: "PATCH",
      body: {
        signing_flow: signingFlow,
        ...(signer ? { signer_id: signer } : {}),
      },
      token,
    },
  );
  if (!data) {
    if (detail === "signer_required")
      return { ...keep, signerError: "signerRequired" };
    if (detail === "signer_not_member")
      return { ...keep, signerError: "signerNotMember" };
    return { ...keep, error: status === 403 ? "notAdmin" : "unavailable" };
  }
  // Who signs decides what the portal offers (signing, publishing).
  revalidatePath("/dashboard", "layout");
  return {
    signingFlow: data.signing_flow,
    signer: data.signer?.id ?? "",
    saved: true,
  };
}

/**
 * Work in another of the account's tenants. The overview is where it lands:
 * whatever was open belonged to the tenant left behind.
 */
export async function chooseTenant(id: string): Promise<void> {
  if (!(await currentTenants()).some((tenant) => tenant.id === id)) return;
  (await cookies()).set(tenantCookie, id, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
