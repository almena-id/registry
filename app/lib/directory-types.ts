/** A tenant's registered things, as the dashboard lists them. Client-safe. */
export const sections = ["issuers", "verifiers", "identities"] as const;
export type Section = (typeof sections)[number];

export function isSection(value: string): value is Section {
  return (sections as readonly string[]).includes(value);
}

/** Issuers and verifiers are described; identities only named, for now. */
export function hasDescription(section: Section): boolean {
  return section !== "identities";
}

export type IdentityRef = { id: string; name: string };
export type Use = {
  kind: "tenant" | "issuer" | "verifier";
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  /** Issuers and verifiers: the identity (DID) they act as. */
  identity?: IdentityRef | null;
  /** Identities: the issuers and verifiers that act as them. */
  used_by?: Use[] | null;
};

export type Page = { items: Item[]; next_cursor: string | null; total: number };

export const pageSize = 20;
