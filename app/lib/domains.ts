import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";

/** A domain linked to the tenant, with the DNS record that proves it. */
export type Domain = {
  id: string;
  domain: string;
  dns_record: { type: string; name: string; value: string };
  verified: boolean;
  verified_at: string | null;
  created_at: string;
};

/** The current tenant's domains; `null` when the API cannot be reached. */
export async function fetchDomains(): Promise<Domain[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<Domain[]>(`/tenants/${tenant.id}/domains`, {
    token,
  });
  return data;
}
