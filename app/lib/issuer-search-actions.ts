"use server";

import { api } from "./api";

/** A published issuer, as the issuer picker shows it. */
export type FoundIssuer = { did: string; name: string };

export type IssuerPage = { items: FoundIssuer[]; next_cursor: string | null };

/**
 * Published issuers, of any tenant, that grant `type`: those whose name or
 * DID has `text` in it, a page at a time (the API's public catalogue);
 * `null` when it cannot be reached.
 */
export async function searchIssuers(
  type: string,
  text: string,
  cursor?: string,
): Promise<IssuerPage | null> {
  const query = new URLSearchParams({ grants: type, limit: "20" });
  if (text.trim()) query.set("q", text.trim().slice(0, 100));
  if (cursor) query.set("cursor", cursor);
  const { data } = await api<{
    items: { did: string; name: string }[];
    next_cursor: string | null;
  }>(`/catalog/issuers?${query}`);
  if (!data) return null;
  return {
    items: data.items.map(({ did, name }) => ({ did, name })),
    next_cursor: data.next_cursor,
  };
}
