import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { api, currentTenant, sessionCookie, type Feature } from "./api";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

/** A tenant's subscription: `null`s with none, the free use of the platform. */
export type Subscription = {
  plan: string | null;
  status: SubscriptionStatus | null;
  current_period_end: string | null;
  /** Whether it gives its plan's features now. */
  in_force: boolean;
  features: Feature[];
  updated_at: string | null;
};

/** Another tenant, as the trust anchor's admins see it. */
export type Account = {
  id: string;
  slug: string;
  name: string | null;
  created_at: string;
  members: number;
  subscription: Subscription;
  /** The anchor's own note on it; never shown to the account. */
  note: string | null;
};

export type AccountPage = { items: Account[]; next_cursor: string | null };

/** The plans a subscription may be on: the API's (`entitlements.PLANS`). */
export const PLANS = ["standard"] as const;

async function session(): Promise<{ token: string; tenant: string } | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  return token && tenant ? { token, tenant: tenant.id } : null;
}

/** The current tenant's subscription; `null` when the API cannot be reached. */
export const fetchSubscription = cache(
  async (): Promise<Subscription | null> => {
    const signed = await session();
    if (!signed) return null;
    const { data } = await api<Subscription>(
      `/tenants/${signed.tenant}/subscription`,
      { token: signed.token },
    );
    return data;
  },
);

/** The trust anchor's admins: the accounts, a page at a time. */
export async function fetchAccounts(filter: {
  q?: string;
  subscribed?: "yes" | "no";
  cursor?: string;
}): Promise<AccountPage | null> {
  const signed = await session();
  if (!signed) return null;
  const query = new URLSearchParams({ limit: "30" });
  if (filter.q?.trim()) query.set("q", filter.q.trim().slice(0, 100));
  if (filter.subscribed) query.set("subscribed", filter.subscribed);
  if (filter.cursor) query.set("cursor", filter.cursor);
  const { data } = await api<AccountPage>(
    `/tenants/${signed.tenant}/accounts?${query}`,
    { token: signed.token },
  );
  return data;
}

/** The trust anchor's admins: one account; `null` when not found. */
export async function fetchAccount(id: string): Promise<Account | null> {
  const signed = await session();
  if (!signed) return null;
  const { data } = await api<Account>(
    `/tenants/${signed.tenant}/accounts/${encodeURIComponent(id)}`,
    { token: signed.token },
  );
  return data;
}
