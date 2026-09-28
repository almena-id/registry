import "server-only";

import { cookies } from "next/headers";

import { api, currentTenants, sessionCookie, type Role } from "./api";

export type TenantDetail = {
  id: string;
  name: string | null;
  created_at: string;
  role: Role;
  mediator_url: string | null;
  mediator_did: string | null;
  /** The organisation's own identity. */
  identity: { id: string; name: string } | null;
};

/** The current tenant's details; `null` when the API cannot be reached. */
export async function fetchTenant(): Promise<TenantDetail | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const { data } = await api<TenantDetail>(`/tenants/${tenant.id}`, { token });
  return data;
}
