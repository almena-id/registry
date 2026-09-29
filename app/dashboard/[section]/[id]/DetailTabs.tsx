"use client";

import { Tabs } from "@/app/components/Tabs";
import { useI18n } from "@/app/i18n/client";

/**
 * What of an item to look at: its summary, the fields that change (issuers,
 * verifiers and mediators; an identity has none), how it signs (issuers and
 * verifiers), and its DID document as JSON.
 */
export function DetailTabs({
  base,
  editable,
  signs,
}: {
  base: string;
  editable: boolean;
  /** Issuers and verifiers: they have a signing system. */
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
        ...(signs ? [{ href: `${base}/signing`, label: copy.signing }] : []),
        { href: `${base}/json`, label: copy.json },
      ]}
    />
  );
}
