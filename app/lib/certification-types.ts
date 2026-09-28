/** A tenant's certification by Almena, as the API describes it. Client-safe. */
export type CertificationStatus =
  "draft" | "in_review" | "approved" | "rejected" | "superseded";

export type Certification = {
  id: string;
  status: CertificationStatus;
  legal_name: string | null;
  domain: string | null;
  /** The TXT record that proves the domain; `null` until there is a domain. */
  dns_record: { type: string; name: string; value: string } | null;
  domain_verified: boolean;
  /** The logo as a `data:` URL. */
  logo: string | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reason: string | null;
};

export type CertificationState = {
  /** The certification in force. */
  current: Certification | null;
  /** The request being worked on or reviewed. */
  request: Certification | null;
};

/** A request waiting in the reviewers' queue. */
export type Pending = {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  legal_name: string | null;
  domain: string | null;
  submitted_at: string | null;
};

export type ReviewDetail = {
  tenant_id: string;
  tenant_name: string | null;
  request: Certification;
  current: Certification | null;
};

/** What the logo input accepts; the API checks the bytes again. */
export const logoTypes = ["image/png", "image/jpeg", "image/webp"];
export const logoMaxBytes = 256 * 1024;
