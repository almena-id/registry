import "server-only";

import { cookies } from "next/headers";

import { api, currentTenants, sessionCookie } from "./api";
import type {
  CertificationState,
  Pending,
  ReviewDetail,
} from "./certification-types";

async function token(): Promise<string | undefined> {
  return (await cookies()).get(sessionCookie)?.value;
}

/** The current tenant's certification; `null` when the API cannot be reached. */
export async function fetchCertification(): Promise<CertificationState | null> {
  const [session, tenants] = await Promise.all([token(), currentTenants()]);
  const tenant = tenants[0];
  if (!session || !tenant) return null;
  const { data } = await api<CertificationState>(
    `/tenants/${tenant.id}/certification`,
    { token: session },
  );
  return data;
}

/** The requests waiting for review; `null` for anyone who is not a reviewer. */
export async function fetchPending(): Promise<Pending[] | null> {
  const session = await token();
  if (!session) return null;
  const { data } = await api<Pending[]>("/review/certifications", {
    token: session,
  });
  return data;
}

export async function fetchReview(id: string): Promise<ReviewDetail | null> {
  const session = await token();
  if (!session) return null;
  const { data } = await api<ReviewDetail>(
    `/review/certifications/${encodeURIComponent(id)}`,
    { token: session },
  );
  return data;
}
