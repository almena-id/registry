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
  /**
   * Each a field of the catalogue by its ref (a tenant's own:
   * `custom:{key}`), and the claim's name in credentials and forms.
   */
  claims: { field: string; name: string; required: boolean }[];
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

/** One of the credential types the trust anchor keeps: `type` as the
 * catalogue serves it. */
export type OwnCredentialType = {
  id: string;
  slug: string;
  key: string;
  type: CredentialType;
};

/**
 * The credential types the current tenant keeps — only the trust anchor
 * keeps any: Almena's catalogue; `null` when unreachable.
 */
export const fetchOwnCredentialTypes = cache(
  async (): Promise<OwnCredentialType[] | null> => {
    const token = (await cookies()).get(sessionCookie)?.value;
    const tenant = await currentTenant();
    if (!token || !tenant) return null;
    const { data } = await api<OwnCredentialType[]>(
      `/tenants/${tenant.id}/credential-types`,
      { token },
    );
    return data;
  },
);

/**
 * What the current tenant's issuers grant and forms ask for: Almena's types,
 * then — for any account but the anchor, whose own are Almena's — its own
 * (`custom:{key}`), filed under the catalogue's categories.
 */
export const fetchTenantCredentialCatalogue = cache(
  async (): Promise<CredentialCatalogue | null> => {
    const [catalogue, own, tenant] = await Promise.all([
      fetchCredentialCatalogue(),
      fetchOwnCredentialTypes(),
      currentTenant(),
    ]);
    if (!catalogue || !own) return null;
    if (tenant?.anchor || !own.length) return catalogue;
    return {
      ...catalogue,
      // Oldest first, as the tenant made them.
      types: [...catalogue.types, ...own.map((item) => item.type).reverse()],
    };
  },
);
