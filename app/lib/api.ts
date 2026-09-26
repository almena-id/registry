import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

/** The session token from the API, kept on the portal's own origin. */
export const sessionCookie = "almena.session";

const apiUrl = () => process.env.REGISTRY_API_URL ?? "https://api.almena.network";

export type User = { id: string; email: string; created_at: string };
export type SignedIn = { token: string; expires_at: string; user: User };

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
    const json = response.status === 204 ? null : await response.json().catch(() => null);
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
