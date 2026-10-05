import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";

/**
 * Something of the tenant's that waits to be signed or published: an
 * identity's DID, an issuer, verifier or mediator, an issuer's status list
 * or an accepted application's credential. The API says why it waits, what
 * has to be done first and whether it is the asker's to do.
 */
export type Pending = {
  kind:
    | "identity"
    | "issuer"
    | "verifier"
    | "mediator"
    | "status_list"
    | "credential";
  action: "sign" | "publish";
  /** The identity, issuer, verifier, mediator, status list or application. */
  id: string;
  /** Its name; a status list's and an application's slug. */
  name: string;
  state: "pending" | "outdated" | "draft" | "expired" | "unsigned" | "accepted";
  /** Status lists and credentials: the issuer whose they are. */
  issuer: { id: string; name: string } | null;
  /** Credentials: the type to issue. */
  credential_type: string | null;
  blocked_by:
    | "identity_pending"
    | "tenant_pending"
    | "signer_needed"
    | "status_list_unsigned"
    | null;
  /** Whether the asker does it. */
  yours: boolean;
};

/**
 * What waits in the current tenant, in the order it is done; `null` when
 * unreachable.
 */
export async function fetchPending(): Promise<Pending[] | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<Pending[]>(`/tenants/${tenant.id}/pending`, {
    token,
  });
  return data;
}
