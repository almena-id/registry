import "server-only";

import { cookies } from "next/headers";

import { api, currentTenants, sessionCookie, type Role } from "./api";

export type Member = {
  status: "member" | "invited";
  email: string;
  role: Role;
  since: string;
};

/** Who belongs to the current tenant and who is invited; `null` when unreachable. */
export async function fetchMembers(): Promise<Member[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = (await currentTenants())[0];
  if (!token || !tenant) return null;
  const { data } = await api<Member[]>(`/tenants/${tenant.id}/members`, {
    token,
  });
  return data;
}
