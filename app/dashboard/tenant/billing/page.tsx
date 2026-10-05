import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/format";
import { fetchSubscription } from "@/app/lib/subscriptions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: `${t.dashboard.tenant.title} · ${t.dashboard.billing.title}`,
  };
}

/**
 * Billing: the account's subscription — its plan, where it stands, until
 * when it is paid — and the features it gives, each said in words. With none,
 * the free use of the platform and what a subscription adds. Payments come
 * later; for now Almena sets subscriptions. The trust anchor has everything.
 */
export default async function TenantBillingPage() {
  const [{ t, locale }, subscription, tenant, timeZone] = await Promise.all([
    getI18n(),
    fetchSubscription(),
    currentTenant(),
    getTimeZone(),
  ]);
  const copy = t.dashboard.billing;

  if (!subscription)
    return (
      <Card className="p-5">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.unavailable}</AlertDescription>
        </Alert>
      </Card>
    );

  if (tenant?.anchor)
    return (
      <Card className="gap-2 p-5">
        <h2 className="text-lg font-semibold">{copy.anchorTitle}</h2>
        <p className="text-muted-foreground">{copy.anchorLead}</p>
      </Card>
    );

  const status = subscription.status;
  const until = subscription.current_period_end;
  const variant =
    status === "active" && subscription.in_force
      ? "brand"
      : status === "past_due" && subscription.in_force
        ? "pending"
        : "muted";

  return (
    <div className="grid gap-4">
      <Card className="gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-muted-foreground">{copy.plan}</p>
            <h2 className="text-lg font-semibold">
              {subscription.plan
                ? (copy.plans[subscription.plan as keyof typeof copy.plans] ??
                  subscription.plan)
                : copy.free}
            </h2>
          </div>
          <Badge variant={variant}>
            {status
              ? subscription.in_force
                ? copy.statuses[status]
                : copy.lapsed
              : copy.freeBadge}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {!status
            ? copy.freeLead
            : !subscription.in_force
              ? copy.lapsedLead
              : until
                ? (status === "past_due"
                    ? copy.pastDueUntil
                    : copy.until
                  ).replace("{date}", formatDateTime(until, locale, timeZone))
                : copy.openEnded}
        </p>
      </Card>

      <Card className="gap-3 p-5">
        <h3 className="font-semibold">{copy.featuresTitle}</h3>
        <ul className="grid gap-2">
          {(["own_fields", "own_credential_types"] as const).map((feature) => {
            const has = subscription.features.includes(feature);
            return (
              <li
                key={feature}
                className="flex items-start justify-between gap-3"
              >
                <span>
                  <span className="font-medium">
                    {copy.features[feature].title}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {copy.features[feature].lead}
                  </span>
                </span>
                <Badge variant={has ? "brand" : "muted"}>
                  {has ? copy.included : copy.notIncluded}
                </Badge>
              </li>
            );
          })}
        </ul>
        {!subscription.in_force && (
          <p className="text-[13px] text-muted-foreground">
            {copy.howToSubscribe}
          </p>
        )}
      </Card>
    </div>
  );
}
