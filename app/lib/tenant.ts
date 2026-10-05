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
  /** The trust anchor: it works in every language of the platform. */
  anchor: boolean;
  /** The languages it works in, of the platform's, in the platform's order. */
  languages: string[];
  /** The organisation's own identity, and the mediator it receives messages through. */
  identity: { id: string; name: string; did: string | null } | null;
  /** `own`: the tenant's; otherwise another tenant's public one. */
  mediator: { id: string; name: string; own: boolean } | null;
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

/** What the tenant must have set up to operate, in the order it is listed. */
export type HealthCheck = {
  check: "name" | "mediator" | "signing_flow";
  done: boolean;
  /** What is missing, when not done. */
  issue: "missing" | "unpublished" | "no_signer" | "no_wallet" | null;
};
export type TenantHealth = {
  /** The share of checks done, 0 to 100. */
  score: number;
  checks: HealthCheck[];
};

/** The current tenant's health; `null` when the API cannot be reached. */
export async function fetchHealth(): Promise<TenantHealth | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<TenantHealth>(`/tenants/${tenant.id}/health`, {
    token,
  });
  return data;
}
