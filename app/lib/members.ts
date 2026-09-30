import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie, type Role } from "./api";

export type Member = {
  status: "member" | "invited";
  /** Members only: their account, and what they like to be called. */
  user_id: string | null;
  alias: string | null;
  /** `null` for a member whose account has no email. */
  email: string | null;
  role: Role;
  since: string;
  /** Members only: an Almena wallet is linked, which everybody needs to work; `null` for invitations. */
  wallet: boolean | null;
};

/** Who belongs to the current tenant and who is invited; `null` when unreachable. */
export async function fetchMembers(): Promise<Member[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<Member[]>(`/tenants/${tenant.id}/members`, {
    token,
  });
  return data;
}
