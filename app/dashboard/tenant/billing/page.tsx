import type { Metadata } from "next";

import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: `${t.dashboard.tenant.title} · ${t.dashboard.billing.title}`,
  };
}

/**
 * Billing: the account's tab for it, drawn before there is anything to bill
 * so the shape of the account is visible; the reason sits inside the frame.
 */
export default async function TenantBillingPage() {
  const { t } = await getI18n();
  return (
    <Card className="items-center gap-2 px-5 py-10 text-center">
      <Badge
        variant="muted"
        className="text-[11px] font-semibold uppercase tracking-wide text-faint"
      >
        {t.dashboard.nav.soon}
      </Badge>
      <p className="text-faint">{t.dashboard.billing.soon}</p>
    </Card>
  );
}
