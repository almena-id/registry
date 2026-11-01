import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";
import type { Activity, ActivitySpan } from "./activity-days";

/**
 * What the current tenant's issuers and verifiers did over the last `days`
 * UTC days, and where things stand; `null` when unreachable.
 */
export async function fetchActivity(
  days: ActivitySpan,
): Promise<Activity | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<Activity>(
    `/tenants/${tenant.id}/activity?days=${days}`,
    { token },
  );
  return data;
}
