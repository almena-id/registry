import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

/** The session token from the API, kept on the portal's own origin. */
export const sessionCookie = "almena.session";

const apiUrl = () =>
  process.env.REGISTRY_API_URL ?? "https://api.almena.network";

export type User = {
  id: string;
  email: string;
  alias: string | null;
  created_at: string;
};
export type SignedIn = { token: string; expires_at: string; user: User };
/** `name` is `null` for the tenant an account is created with, until it is given one. */
export type Role = "admin" | "member";
export type Tenant = {
  id: string;
  name: string | null;
  created_at: string;
  role: Role;
};

/** A call to the API from the server; `null` status when it cannot be reached. */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {},
): Promise<{ status: number | null; data: T | null; detail: string | null }> {
  try {
    const response = await fetch(`${apiUrl()}/api/v1${path}`, {
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const json =
      response.status === 204 ? null : await response.json().catch(() => null);
    const ok = response.ok;
    return {
      status: response.status,
      data: ok ? (json as T) : null,
      detail: !ok && typeof json?.detail === "string" ? json.detail : null,
    };
  } catch {
    return { status: null, data: null, detail: null };
  }
}

/**
 * The signed-in account, or `null`: the API is the authority, not the cookie.
 * Asked once per request however many layouts and pages want it.
 */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const { data } = await api<User>("/auth/me", { token });
  return data;
});

export const providerIds = ["google", "microsoft", "apple", "github"] as const;
export type ProviderId = (typeof providerIds)[number];
export type Provider = { id: ProviderId; enabled: boolean };

export function isProviderId(value: string): value is ProviderId {
  return (providerIds as readonly string[]).includes(value);
}

/** Social sign-in providers and which are configured; all off when the API is unreachable. */
export async function socialProviders(): Promise<Provider[]> {
  const { data } = await api<{ providers: Provider[] }>("/auth/providers");
  return data?.providers ?? providerIds.map((id) => ({ id, enabled: false }));
}

/** The signed-in account's tenants, oldest first; empty when signed out or unreachable. */
export const currentTenants = cache(async (): Promise<Tenant[]> => {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return [];
  const { data } = await api<Tenant[]>("/tenants", { token });
  return data ?? [];
});
