"use client";

import { Tabs } from "@/app/components/Tabs";
import { useI18n } from "@/app/i18n/client";

/**
 * What of an item to look at: its summary, the fields that change (issuers,
 * verifiers and mediators; an identity has none), the credential types it
 * grants (issuers), how it signs and its queue (issuers and verifiers), its status lists
 * (issuers), and its DID document as JSON.
 */
export function DetailTabs({
  base,
  editable,
  signs,
  issues = false,
  verifies = false,
}: {
  base: string;
  editable: boolean;
  /** Issuers: the credential types they grant, and their status lists. */
  issues?: boolean;
  /** Verifiers: they ask wallets, by QR, to present a form's credentials. */
  verifies?: boolean;
  /** Issuers and verifiers: they have a signing system, and a queue. */
  signs: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.detail;
  return (
    <Tabs
      label={copy.tabs}
      tabs={[
        { href: base, label: copy.summary },
        ...(editable ? [{ href: `${base}/data`, label: copy.data }] : []),
        ...(issues
          ? [{ href: `${base}/credentials`, label: copy.credentials }]
          : []),
        ...(signs ? [{ href: `${base}/signing`, label: copy.signing }] : []),
        ...(signs ? [{ href: `${base}/queue`, label: copy.queue }] : []),
        ...(verifies ? [{ href: `${base}/verify`, label: copy.verify }] : []),
        ...(issues ? [{ href: `${base}/status`, label: copy.status }] : []),
        { href: `${base}/json`, label: copy.json },
      ]}
    />
  );
}
