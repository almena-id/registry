import "server-only";

import { cookies } from "next/headers";

import { api, sessionCookie, type WaysIn } from "./api";

/** The signed-in account's ways in; `null` when the API cannot be reached. */
export async function fetchWaysIn(): Promise<WaysIn | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const { data } = await api<WaysIn>("/auth/me/ways-in", { token });
  return data;
}
