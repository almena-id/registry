import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { getI18n } from "@/app/i18n/server";
import { api, currentTenant, sessionCookie } from "./api";
import type { Catalogue, CatalogueField } from "./form-fields";
import type { Texts } from "./texts";

/**
 * Almena's field catalogue (public); `null` when the API cannot be reached.
 * Asked once per request however many components want it.
 */
export const fetchCatalogue = cache(async (): Promise<Catalogue | null> => {
  const { data } = await api<Catalogue>("/catalog/fields");
  return data;
});

/**
 * One of the tenant's own fields: `field` is it in the catalogue's terms. The
 * trust anchor's are Almena's catalogue itself (`ref` is the key).
 */
export type CustomField = {
  id: string;
  slug: string;
  key: string;
  ref: string;
  field: CatalogueField;
  /** As kept, for changing it. */
  definition: {
    max_length?: number;
    pattern?: string;
    options?: { value: string; labels: Texts }[];
    formats?: string[];
    /** Set on groups and on fields of a value domain: their definition stays. */
    domain?: string;
    /** Of its domain, the values it takes; all of them when absent. */
    values?: (string | number)[];
    /** A group's parts, as kept. */
    parts?: {
      key: string;
      required?: boolean;
      field: {
        type: string;
        labels: Texts;
        source?: string;
        definition?: { max_length?: number; domain?: string };
      };
    }[];
  };
  created_at: string;
};

/** The current tenant's own fields, newest first; `null` when unreachable. */
export const fetchCustomFields = cache(
  async (): Promise<CustomField[] | null> => {
    const token = (await cookies()).get(sessionCookie)?.value;
    const tenant = await currentTenant();
    if (!token || !tenant) return null;
    const { data } = await api<CustomField[]>(`/tenants/${tenant.id}/fields`, {
      token,
    });
    return data;
  },
);

/**
 * What the current tenant's forms may ask for: Almena's catalogue, then the
 * tenant's own fields as one more category ("Your fields"). The trust
 * anchor's own fields are the catalogue already.
 */
export const fetchTenantCatalogue = cache(
  async (): Promise<Catalogue | null> => {
    const [catalogue, custom, tenant, { t }] = await Promise.all([
      fetchCatalogue(),
      fetchCustomFields(),
      currentTenant(),
      getI18n(),
    ]);
    if (!catalogue || !custom) return null;
    if (!custom.length || tenant?.anchor) return catalogue;
    const yours = t.dashboard.catalogue.yours;
    return {
      ...catalogue,
      categories: [
        ...catalogue.categories,
        { id: "custom", labels: { en: yours, es: yours } },
      ],
      fields: [
        ...catalogue.fields,
        // Oldest first, as the tenant made them.
        ...custom.map((item) => item.field).reverse(),
      ],
    };
  },
);
