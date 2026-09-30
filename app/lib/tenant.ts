import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie, type Role } from "./api";
import type { Signer } from "./directory-types";
import type { SigningFlow } from "./signing-flows";

export type TenantDetail = {
  id: string;
  name: string | null;
  created_at: string;
  role: Role;
  /** Whether the user signs as the tenant under its flow. */
  signs: boolean;
  /** The organisation's own identity, and the mediator it receives messages through. */
  identity: { id: string; name: string } | null;
  mediator: { id: string; name: string } | null;
  /** Who signs as the account: its identities' DIDs and its endorsements. */
  signing_flow: SigningFlow;
  /** `single_user`: who signs; `null` under any other flow. */
  signer: Signer | null;
};

/** The current tenant's details; `null` when the API cannot be reached. */
export async function fetchTenant(): Promise<TenantDetail | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<TenantDetail>(`/tenants/${tenant.id}`, { token });
  return data;
}
