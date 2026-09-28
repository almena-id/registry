import "server-only";

import { cookies } from "next/headers";

import { api, currentTenants, sessionCookie } from "./api";
import {
  pageSize,
  type DescribedDetail,
  type IdentityDetail,
  type Item,
  type MediatorDetail,
  type Page,
  type Section,
  type Signing,
} from "./directory-types";

/**
 * One page of the current tenant's issuers, verifiers or identities; `null`
 * when the API cannot be reached. The tenant is the one the header shows.
 */
export async function fetchPage(
  section: Section,
  cursor?: string | null,
  limit = pageSize,
): Promise<Page | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  const { data } = await api<Page>(
    `/tenants/${tenant.id}/${section}?${query}`,
    { token },
  );
  return data;
}

/** One of the current tenant's identities; `null` when missing or unreachable. */
export async function fetchIdentity(
  id: string,
): Promise<IdentityDetail | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const { data } = await api<IdentityDetail>(
    `/tenants/${tenant.id}/identities/${encodeURIComponent(id)}`,
    { token },
  );
  return data;
}

/** One of the current tenant's mediators; `null` when missing or unreachable. */
export async function fetchMediator(
  id: string,
): Promise<MediatorDetail | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const { data } = await api<MediatorDetail>(
    `/tenants/${tenant.id}/mediators/${encodeURIComponent(id)}`,
    { token },
  );
  return data;
}

/** One of the current tenant's issuers or verifiers; `null` when missing or unreachable. */
export async function fetchDescribed(
  section: "issuers" | "verifiers",
  id: string,
): Promise<DescribedDetail | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const { data } = await api<DescribedDetail>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}`,
    { token },
  );
  return data;
}

/**
 * The current tenant's mediators, to pick one from: the first hundred, which
 * is more than a tenant is expected to run; `null` when unreachable.
 */
export async function fetchMediatorChoices(): Promise<Item[] | null> {
  return (await fetchPage("mediators", null, 100))?.items ?? null;
}

/** How one of the current tenant's issuers or verifiers signs; `null` when unreachable. */
export async function fetchSigning(
  section: "issuers" | "verifiers",
  id: string,
): Promise<Signing | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const { data } = await api<Signing>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}/signing`,
    { token },
  );
  return data;
}
