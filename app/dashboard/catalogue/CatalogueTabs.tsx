"use client";

import { Tabs } from "@/app/components/Tabs";
import { useI18n } from "@/app/i18n/client";

/** The catalogue's halves: the fields forms are made of, the credential types. */
export function CatalogueTabs() {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;
  return (
    <Tabs
      label={copy.title}
      tabs={[
        { href: "/dashboard/catalogue", label: copy.fieldsTab },
        {
          href: "/dashboard/catalogue/credentials",
          label: copy.credentialsTab,
        },
      ]}
    />
  );
}
