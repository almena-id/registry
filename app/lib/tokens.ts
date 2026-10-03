import "server-only";

import { cookies } from "next/headers";

import { api, sessionCookie } from "./api";

/** An API token of the signed-in account, as the API lists it (never its secret). */
export type ApiToken = {
  id: string;
  name: string;
  created_at: string;
  expires_at: string;
  last_used_at: string;
};

/** The account's API tokens, newest first; `null` when unreachable. */
export async function fetchTokens(): Promise<ApiToken[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const { data } = await api<{ items: ApiToken[] }>("/auth/me/tokens", {
    token,
  });
  return data?.items ?? null;
}
