import type { Texts } from "./texts";

/** A tenant's registered things, as the dashboard lists them. Client-safe. */
export const sections = [
  "issuers",
  "verifiers",
  "mediators",
  "identities",
] as const;
export type Section = (typeof sections)[number];

export function isSection(value: string): value is Section {
  return (sections as readonly string[]).includes(value);
}

/**
 * Issuers and verifiers are described and pick a mediator (the tenant's, or a
 * public one);
 * mediators have an address; identities only a name, for now.
 */
export function hasDescription(section: Section): boolean {
  return section === "issuers" || section === "verifiers";
}

/** The sections whose items open on a screen of their own: all of them. */
export function opens(section: Section): boolean {
  return isSection(section);
}

export type IdentityRef = { id: string; name: string };
/** `own`: the tenant's; otherwise another tenant's public one. */
export type MediatorRef = { id: string; name: string; own: boolean };

/**
 * A mediator the tenant may pick: its own (drafts too), or another tenant's
 * public and published one.
 */
export type MediatorChoice = {
  id: string;
  name: string;
  url: string;
  own: boolean;
  published: boolean;
};

/** The choices as a `Select`'s options, the public ones marked so. */
export function mediatorOptions(
  choices: MediatorChoice[],
  publicLabel: string,
): { value: string; label: string }[] {
  return choices.map((choice) => ({
    value: choice.id,
    label: choice.own
      ? choice.name
      : publicLabel.replace("{name}", choice.name),
  }));
}
export type Use = {
  kind: "tenant" | "issuer" | "verifier" | "mediator";
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  /** Issuers and verifiers: by language. */
  description: Texts | null;
  created_at: string;
  /** Issuers, verifiers and mediators: the identity (DID) they act as. */
  identity?: IdentityRef | null;
  /** Issuers and verifiers: the mediator they receive messages through. */
  mediator?: MediatorRef | null;
  /** Mediators: where they listen, and whether every tenant is offered them. */
  url?: string | null;
  public?: boolean | null;
  /** Identities: the tenant, issuer, verifier or mediator that acts as them. */
  used_by?: Use[] | null;
  /** Issuers, verifiers and mediators: when published; `null` while a draft. */
  published_at?: string | null;
  /** In lists: where its DID's signature stands. */
  signature?: Signature | null;
};

/**
 * Where an identity's DID stands. People sign it from their wallets: until the
 * first entry of its did:webvh log is signed it is `pending` and has no DID;
 * `outdated` when what it should publish (`document`) differs from what was
 * last signed. The log and the did:web document are served once it has a DID.
 */
export type Signature = "pending" | "signed" | "outdated";
export type Signed = {
  did: string | null;
  signature: Signature;
  document: Record<string, unknown>;
  /** What its log says now, as signed; `null` while pending. */
  signed_document: Record<string, unknown> | null;
  /** The top-level fields `document` changes from `signed_document` (outdated). */
  changes: string[];
  log_url: string | null;
  document_url: string | null;
  /** A published issuer's, verifier's or mediator's endorsement by its tenant. */
  whois_url?: string | null;
  endorsed_until?: string | null;
};

/**
 * An issuer, verifier or mediator, opened from the list: its identity's DID,
 * the document it should publish, and where it is (a draft's is not).
 */
export type DescribedDetail = Item &
  Signed & {
    identity: IdentityRef;
  };

/** One mediator, opened from the list: its address and its DID. */
export type MediatorDetail = DescribedDetail & { url: string; public: boolean };

/** One identity, opened from the list: its DID and the document it publishes. */
export type IdentityDetail = Signed & {
  id: string;
  name: string;
  created_at: string;
  used_by: Use[];
  /** Whether the URLs answer: not while what acts as it is a draft. */
  published: boolean;
};

/**
 * How an issuer or verifier signs. People sign from their wallets; the
 * catalogue so far has one system, `single_user`: one member signs alone.
 */
export type SigningSystem = "single_user";
/** A named signer: an issuer's or verifier's, or the tenant's own (`single_user`). */
export type Signer = {
  id: string;
  email: string;
  alias: string | null;
  /** A signer who left the tenant signs nothing. */
  member: boolean;
  /** Has an Almena wallet linked: without one there is no key to publish. */
  wallet: boolean;
};
export type Signing = {
  system: SigningSystem | null;
  signer: Signer | null;
};

export type Page = { items: Item[]; next_cursor: string | null; total: number };

export const pageSize = 20;
