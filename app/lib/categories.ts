import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";
import type { Labels } from "./form-fields";

/** One of the trust anchor's categories, for fields or credential types. */
export type Category = {
  id: string;
  kind: "field" | "credential";
  key: string;
  labels: Labels;
  /** How many fields, or credential types of any account, are filed under it. */
  uses: number;
  created_at: string;
};

/** The trust anchor's categories; `null` when unreachable or not the anchor. */
export async function fetchCategories(): Promise<Category[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant?.anchor) return null;
  const { data } = await api<Category[]>(`/tenants/${tenant.id}/categories`, {
    token,
  });
  return data;
}
