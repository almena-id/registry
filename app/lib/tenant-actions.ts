"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenants, sessionCookie } from "./api";
import type { TenantDetail } from "./tenant";

type ErrorKey = keyof Dictionary["dashboard"]["tenant"]["errors"];

export type TenantState = {
  name?: string;
  mediator?: string;
  did?: string | null;
  saved?: boolean;
  errors?: { name?: ErrorKey; mediator?: ErrorKey; form?: ErrorKey };
};

const mediatorErrors: Record<string, ErrorKey> = {
  mediator_invalid: "mediatorInvalid",
  mediator_insecure: "mediatorInsecure",
  mediator_unreachable: "mediatorUnreachable",
  mediator_not_a_mediator: "mediatorNotAMediator",
};

export async function saveTenant(
  state: TenantState,
  form: FormData,
): Promise<TenantState> {
  const name = String(form.get("name") ?? "").trim();
  const mediator = String(form.get("mediator") ?? "").trim();
  const keep = { name, mediator, did: state.did };
  if (!name) return { ...keep, errors: { name: "nameRequired" } };
  if (name.length > 200) return { ...keep, errors: { name: "nameLong" } };

  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return { ...keep, errors: { form: "unavailable" } };
  const { status, data, detail } = await api<TenantDetail>(
    `/tenants/${tenant.id}`,
    {
      method: "PATCH",
      body: { name, mediator_url: mediator || null },
      token,
    },
  );
  if (!data) {
    if (detail === "name_required")
      return { ...keep, errors: { name: "nameRequired" } };
    if (detail && mediatorErrors[detail]) {
      return { ...keep, errors: { mediator: mediatorErrors[detail] } };
    }
    if (status === 403) return { ...keep, errors: { form: "notAdmin" } };
    return { ...keep, errors: { form: "unavailable" } };
  }
  // The header shows the tenant's name.
  revalidatePath("/dashboard", "layout");
  return {
    name: data.name ?? "",
    mediator: data.mediator_url ?? "",
    did: data.mediator_did,
    saved: true,
  };
}
