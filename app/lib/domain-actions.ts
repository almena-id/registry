"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Dictionary } from "@/app/i18n/config";
import { api, currentTenant, sessionCookie } from "./api";

type ErrorKey = keyof Dictionary["dashboard"]["domains"]["errors"];

export type DomainState = {
  domain?: string;
  error?: ErrorKey;
};

const CODES: Record<string, ErrorKey> = {
  domain_invalid: "domainInvalid",
  domain_exists: "domainExists",
  dns_record_not_found: "recordNotFound",
  dns_unavailable: "dnsUnavailable",
  not_admin: "notAdmin",
};

async function call<T = unknown>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<{ error: ErrorKey | null; data: T | null }> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return { error: "unavailable", data: null };
  const { status, data, detail } = await api<T>(
    `/tenants/${tenant.id}/domains${path}`,
    { ...init, token },
  );
  if (status !== null && status < 300) {
    revalidatePath("/dashboard/tenant", "layout");
    return { error: null, data };
  }
  return {
    error:
      (detail && CODES[detail]) ||
      (status === 403 ? "notAdmin" : "unavailable"),
    data: null,
  };
}

export async function addDomain(
  _: DomainState,
  form: FormData,
): Promise<DomainState> {
  const domain = String(form.get("domain") ?? "").trim();
  if (!domain) return { domain, error: "domainRequired" };
  const { error, data } = await call<{ id: string }>("", {
    method: "POST",
    body: { domain },
  });
  if (error) return { domain, error };
  // Back to the list with the new one open: its record is the next step.
  redirect(
    data?.id
      ? `/dashboard/tenant/domains?open=${encodeURIComponent(data.id)}`
      : "/dashboard/tenant/domains",
  );
}

export async function checkDomain(id: string): Promise<DomainState> {
  const { error } = await call(`/${encodeURIComponent(id)}/check`, {
    method: "POST",
  });
  return error ? { error } : {};
}

export async function removeDomain(id: string): Promise<DomainState> {
  const { error } = await call(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return error ? { error } : {};
}
