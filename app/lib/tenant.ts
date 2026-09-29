import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie, type Role } from "./api";

export type TenantDetail = {
  id: string;
  name: string | null;
  created_at: string;
  role: Role;
  /** The organisation's own identity, and the mediator it receives messages through. */
  identity: { id: string; name: string } | null;
  mediator: { id: string; name: string } | null;
};

/** The current tenant's details; `null` when the API cannot be reached. */
export async function fetchTenant(): Promise<TenantDetail | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<TenantDetail>(`/tenants/${tenant.id}`, { token });
  return data;
}
