import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";

/** What an issued credential's status is, as its issuer's list says. */
export type CredentialStatus = "valid" | "suspended" | "revoked";

/**
 * One of an issuer's status lists (IETF Token Status List): where verifiers
 * read it, how many entries it has and how many are taken, revoked or
 * suspended, and whether its signer must sign it (again).
 */
export type StatusList = {
  id: string;
  slug: string;
  uri: string;
  size: number;
  bits: number;
  used: number;
  revoked: number;
  suspended: number;
  revision: number;
  signed_at: string | null;
  needs_signing: boolean;
};

export type StatusLists = {
  items: StatusList[];
  /** The one asking is the issuer's signer, with a wallet its DID lists. */
  can_sign: boolean;
  /** The issuer has no signer set: its Signing tab names one. */
  signer_needed: boolean;
};

/** An issuer of the current tenant's status lists; `null` without the API. */
export async function fetchStatusLists(
  issuerId: string,
): Promise<StatusLists | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<StatusLists>(
    `/tenants/${tenant.id}/issuers/${encodeURIComponent(issuerId)}/status-lists`,
    { token },
  );
  return data;
}

/**
 * Where a page that signs may go back to: one of the dashboard's own paths,
 * never anywhere else.
 */
export function safeBack(back: string | undefined, fallback: string): string {
  return back && /^\/dashboard\/[\w\-/]*$/.test(back) ? back : fallback;
}
