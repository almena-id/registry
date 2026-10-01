import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

/** The session token from the API, kept on the portal's own origin. */
export const sessionCookie = "almena.session";

const apiUrl = () => process.env.REGISTRY_API_URL ?? "https://api.almena.id";

export type User = {
  id: string;
  /** `null` for an account that signs in only through a provider or its wallet. */
  email: string | null;
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
  /** Whether the user signs as the tenant under its flow: signing and publishing are theirs. */
  signs: boolean;
};

/** A call to the API from the server; `null` status when it cannot be reached. */
export async function api<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string;
    /** A body sent as it is, with its media type, instead of JSON. */
    raw?: { data: ArrayBuffer; type: string };
    /** A multipart body (file uploads); its boundary sets the media type. */
    form?: FormData;
    /** More headers (an application's secret). */
    headers?: Record<string, string>;
  } = {},
): Promise<{
  status: number | null;
  data: T | null;
  detail: string | null;
  /** A failure's `detail` when it is more than a code (an object). */
  failure?: unknown;
}> {
  try {
    const response = await fetch(`${apiUrl()}/api/v1${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(init.form
          ? {}
          : { "Content-Type": init.raw?.type ?? "application/json" }),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        ...init.headers,
      },
      body:
        init.form ??
        init.raw?.data ??
        (init.body === undefined ? undefined : JSON.stringify(init.body)),
      cache: "no-store",
    });
    const json =
      response.status === 204 ? null : await response.json().catch(() => null);
    const ok = response.ok;
    return {
      status: response.status,
      data: ok ? (json as T) : null,
      detail: !ok && typeof json?.detail === "string" ? json.detail : null,
      failure: ok ? undefined : json?.detail,
    };
  } catch {
    return { status: null, data: null, detail: null };
  }
}

/** A call to the API whose body is handed on as it is (a file). */
export async function apiRaw(path: string, token: string): Promise<Response> {
  return fetch(`${apiUrl()}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
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

/** A provider account linked to the signed-in account; `email` as the provider showed it. */
export type LinkedAccount = {
  id: string;
  /** `almena`: a wallet, known by its `did`. */
  provider: ProviderId | "almena";
  did: string | null;
  email: string | null;
  created_at: string;
};
export type WaysIn = { email: string | null; accounts: LinkedAccount[] };
/**
 * Linking a way in: `taken` when it belongs to another account, with the
 * ticket that moves this one there when it is still empty.
 */
export type LinkResult = {
  status: "linked" | "taken";
  move_ticket: string | null;
};

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

/** The tenant chosen in the header, kept by id; not an authority — the API checks membership. */
export const tenantCookie = "almena.tenant";

/**
 * The tenant the dashboard works in: the one chosen in the header while the
 * account still belongs to it, else the oldest; `null` with none.
 */
export const currentTenant = cache(async (): Promise<Tenant | null> => {
  const [tenants, chosen] = await Promise.all([
    currentTenants(),
    cookies().then((jar) => jar.get(tenantCookie)?.value),
  ]);
  return tenants.find((tenant) => tenant.id === chosen) ?? tenants[0] ?? null;
});
