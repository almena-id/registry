"use client";

import { Tabs } from "@/app/components/Tabs";
import { useI18n } from "@/app/i18n/client";

/** The account's sections: its details, billing and DID document. */
export function TenantTabs() {
  const { t } = useI18n();
  const copy = t.dashboard.detail;
  return (
    <Tabs
      label={copy.tabs}
      tabs={[
        { href: "/dashboard/tenant", label: copy.data },
        { href: "/dashboard/tenant/billing", label: t.dashboard.billing.title },
        { href: "/dashboard/tenant/json", label: copy.json },
      ]}
    />
  );
}
