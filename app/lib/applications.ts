import "server-only";

import { cookies } from "next/headers";

import { api, currentTenant, sessionCookie } from "./api";
import type { CredentialType } from "./credential-catalog";
import type {
  CatalogueField,
  CredentialRequest,
  FormField,
  Labels,
} from "./form-fields";
import type { CredentialStatus } from "./status-lists";
import type { Texts } from "./texts";

/** Where whoever started an application keeps its secret (one per application). */
export const applicationCookie = (id: string) => `almena.application.${id}`;

/** A form field as an offer shows it: the form's settings and its definition. */
export type OfferField = FormField & { key: string; field: CatalogueField };

export type Offer = {
  issuer: {
    slug: string;
    name: string;
    description: string | null;
    did: string;
  };
  credential_type: CredentialType;
  form: {
    slug: string;
    name: Texts;
    description: Texts | null;
    fields: OfferField[];
    credentials: CredentialRequest[];
  };
};

export type FileMeta = {
  filename: string;
  media_type: string;
  size: number;
  digest: string;
};

export type Presented = {
  key: string;
  type: string;
  presented: boolean;
  verified: boolean;
  format: string | null;
  issuer: string | null;
  claims: Record<string, unknown>;
  fills: Record<string, unknown>;
  problems: string[];
};

export type ApplicationStatus =
  "open" | "paired" | "submitted" | "accepted" | "rejected" | "issued";

export type WalletState = {
  purpose: "pair" | "present" | "submit" | "receive" | null;
  answered: boolean;
  live: boolean;
  deep_link: string | null;
  expires_at: string | null;
};

/** An application, as whoever holds its secret sees it. */
export type HolderApplication = {
  id: string;
  slug: string;
  status: ApplicationStatus;
  holder_did: string | null;
  offer: Offer;
  answers: Record<string, unknown>;
  filled: Record<string, unknown>;
  files: Record<string, FileMeta>;
  presented: Presented[];
  wallet: WalletState;
  submitted_at: string | null;
  decided_at: string | null;
  decision_note: string | null;
  issued_at: string | null;
  valid_until: string | null;
  delivered_at: string | null;
  /** Issued: its status, as the issuer's status list says. */
  credential_status: CredentialStatus | null;
};

/** An issuer's offer, public; `null` when there is none (or no API). */
export async function fetchOffer(
  issuer: string,
  type: string,
): Promise<Offer | null> {
  const { data } = await api<Offer>(
    `/catalog/issuers/${encodeURIComponent(issuer)}/offers/${encodeURIComponent(type)}`,
  );
  return data;
}

/** The secret of an application this browser started, if it did. */
export async function applicationSecret(id: string): Promise<string | null> {
  return (await cookies()).get(applicationCookie(id))?.value ?? null;
}

/** An application this browser started; `null` otherwise, or when gone. */
export async function fetchApplication(
  id: string,
): Promise<HolderApplication | null> {
  const secret = await applicationSecret(id);
  if (!secret) return null;
  const { data } = await api<HolderApplication>(
    `/applications/${encodeURIComponent(id)}`,
    { headers: { "X-Application-Secret": secret } },
  );
  return data;
}

/** One answer of a received application, as the holder signed it. */
export type SignedAnswer = {
  key: string;
  label: Labels;
  value: unknown;
  text: Labels;
  verified: boolean;
};

export type ReceivedSummary = {
  id: string;
  slug: string;
  status: ApplicationStatus;
  issuer: { id: string; name: string };
  credential_type: string;
  form: Texts;
  holder_did: string | null;
  submitted_at: string | null;
  credential_status: CredentialStatus | null;
};

export type Received = {
  id: string;
  slug: string;
  status: ApplicationStatus;
  issuer: { id: string; name: string };
  form: { id: string; name: Texts };
  holder_did: string;
  content: {
    application: string;
    issuer: string;
    credential_type: string;
    form: string;
    answers: SignedAnswer[];
    credentials: {
      key: string;
      type: string;
      issuer: string;
      claims: Record<string, unknown>;
    }[];
  };
  files: Record<string, FileMeta>;
  presented: Presented[];
  digest: string;
  signature: string;
  signature_valid: boolean;
  submitted_at: string;
  decided_at: string | null;
  decision_note: string | null;
  issued_at: string | null;
  valid_until: string | null;
  delivered_at: string | null;
  /** Issued: its status, as the issuer's status list says, and since when. */
  credential_status: CredentialStatus | null;
  credential_status_at: string | null;
  /** Its entry in the issuer's status list; `null` if issued before them. */
  status_list: { uri: string; index: number } | null;
  /** The statuses its issuer's signer may give it next (revoking is final). */
  credential_statuses: CredentialStatus[];
};

async function tenantCall<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return null;
  const { data } = await api<T>(`/tenants/${tenant.id}/applications${path}`, {
    token,
  });
  return data;
}

/** The applications the current tenant's issuers received. */
export const fetchReceived = () => tenantCall<ReceivedSummary[]>("");

export const fetchReceivedOne = (id: string) =>
  tenantCall<Received>(`/${encodeURIComponent(id)}`);

/** An accepted application's credential, as it would be issued. */
export type IssuanceProposal = {
  credential_type: CredentialType;
  claims: { field: CatalogueField; required: boolean; value: unknown }[];
  valid_until: string;
  holder_did: string;
  /** The one asking is the issuer's signer, with a wallet its DID lists. */
  can_sign: boolean;
  /** The issuer has no signer set: its Signing tab names one. */
  signer_needed: boolean;
  /** The status list it goes in is signed: it may be issued. */
  status_list_ready: boolean;
};

export const fetchIssuance = (id: string) =>
  tenantCall<IssuanceProposal>(`/${encodeURIComponent(id)}/issuance`);
