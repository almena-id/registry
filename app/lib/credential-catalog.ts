import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { api, currentTenant, sessionCookie } from "./api";
import type { Labels } from "./form-fields";

/** One of Almena's credential types, as the API serves it. */
export type CredentialType = {
  id: string;
  category: string;
  labels: Labels;
  descriptions: Labels;
  source: string;
  /** `almena`: a tenant's issuer grants it; `external`: only asked for (EU PID). */
  issuance: "almena" | "external";
  /** Each a field of the field catalogue, by id. */
  claims: { field: string; required: boolean }[];
  formats: {
    "dc+sd-jwt": { vct: string };
    jwt_vc_json?: { type: string[] };
    mso_mdoc?: { doctype: string };
  };
  schema: string;
  /** Almena's own: where its SD-JWT VC Type Metadata is served. */
  metadata?: string;
};

export type CredentialCatalogue = {
  version: string;
  categories: { id: string; labels: Labels }[];
  types: CredentialType[];
};

/** Almena's credential type catalogue (public); `null` when unreachable. */
export const fetchCredentialCatalogue = cache(
  async (): Promise<CredentialCatalogue | null> => {
    const { data } = await api<CredentialCatalogue>("/catalog/credentials");
    return data;
  },
);

/** The credential types an issuer of the current tenant grants, and the
 * form for each it offers (by type id). */
export async function fetchIssuerCredentialTypes(
  issuerId: string,
): Promise<{ types: string[]; forms: Record<string, string> } | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<{
    types: string[];
    forms: Record<string, string>;
  }>(
    `/tenants/${tenant.id}/issuers/${encodeURIComponent(issuerId)}/credential-types`,
    { token },
  );
  return data;
}

/** A published issuer of any tenant, as the public catalogue lists it. */
export type PublishedIssuer = {
  did: string;
  name: string;
  description: string | null;
  /** Where its offers are. */
  slug: string | null;
  credential_types: string[] | null;
  /** The types it offers: with a form to apply. */
  offers: string[] | null;
};

type IssuerPage = { items: PublishedIssuer[]; next_cursor: string | null };

/**
 * The published issuers, every page of the public catalogue (up to a few
 * hundred): who a form may trust a credential from.
 */
export const fetchPublishedIssuers = cache(
  async (): Promise<PublishedIssuer[] | null> => {
    const found: PublishedIssuer[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 5; page++) {
      const query: string = cursor
        ? `&cursor=${encodeURIComponent(cursor)}`
        : "";
      const response: { data: IssuerPage | null } = await api<IssuerPage>(
        `/catalog/issuers?limit=100${query}`,
      );
      const data: IssuerPage | null = response.data;
      if (!data) return page ? found : null;
      found.push(...data.items);
      cursor = data.next_cursor;
      if (!cursor) break;
    }
    return found;
  },
);
