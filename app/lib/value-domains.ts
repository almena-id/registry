import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";
import type { Labels } from "./form-fields";

/** One code of a value domain. */
export type DomainCode = {
  value: string | number;
  labels: Labels;
  /** File formats: the media type a file in this format comes as. */
  media_type?: string;
};

/** One of the trust anchor's value domains. */
export type ValueDomain = {
  id: string;
  key: string;
  labels: Labels;
  source: string;
  codes: DomainCode[];
  /** How many fields, of any account, draw on it. */
  uses: number;
  created_at: string;
};

/** The trust anchor's value domains; `null` when unreachable or not the anchor. */
export async function fetchValueDomains(): Promise<ValueDomain[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant?.anchor) return null;
  const { data } = await api<ValueDomain[]>(
    `/tenants/${tenant.id}/value-domains`,
    { token },
  );
  return data;
}
