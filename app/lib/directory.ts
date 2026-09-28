import "server-only";

import { cookies } from "next/headers";

import { api, currentTenants, sessionCookie } from "./api";
import { pageSize, type Page, type Section } from "./directory-types";

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
