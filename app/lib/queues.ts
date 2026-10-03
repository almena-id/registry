import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";

/** An issuer's or verifier's queue at the broker, as the API describes it. */
export type Queue = {
  /** `subject.{slug}`; `null` while it has none. */
  queue: string | null;
  /** Who reads it: the issuer's or verifier's slug. */
  user: string;
  amqp_url: string;
  vhost: string;
  created_at: string | null;
};

/** One of the current tenant's issuers' or verifiers' queue; `null` when unreachable. */
export async function fetchQueue(
  section: "issuers" | "verifiers",
  id: string,
): Promise<Queue | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<Queue>(
    `/tenants/${tenant.id}/${section}/${encodeURIComponent(id)}/queue`,
    { token },
  );
  return data;
}
