import { CheckIcon, CircleIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { RingGauge } from "@/app/components/charts/RingGauge";
import { getI18n } from "@/app/i18n/server";
import { fetchHealth, fetchTenant, type HealthCheck } from "@/app/lib/tenant";

const rowClass =
  "flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0";

/**
 * Where each task is done: on the thing it names (`item`) when there is one —
 * the account's identity to sign, an issuer or verifier to give a signer, a
 * queue or its status lists — else where it is set. An own mediator chosen
 * but waiting to be published opens itself.
 */
function taskHref(check: HealthCheck, ownMediator: string | null): string {
  switch (check.check) {
    case "signing_flow":
      return "/dashboard/signing";
    case "identity":
      return check.item
        ? `/dashboard/identities/${check.item}/sign`
        : "/dashboard/tenant";
    case "mediator":
      return check.issue === "unpublished" && ownMediator
        ? `/dashboard/mediators/${ownMediator}`
        : "/dashboard/tenant";
    case "signers":
      return check.item && check.item_kind
        ? `/dashboard/${check.item_kind}s/${check.item}/signing`
        : "/dashboard/issuers";
    case "status_lists":
      return check.item
        ? `/dashboard/issuers/${check.item}/status`
        : "/dashboard/issuers";
    case "queues":
      return check.item && check.item_kind
        ? `/dashboard/${check.item_kind}s/${check.item}/queue`
        : "/dashboard/issuers";
    case "published":
      if (check.item && check.item_kind)
        return `/dashboard/${check.item_kind}s/${check.item}`;
      return check.issue === "missing"
        ? "/dashboard/issuers/new"
        : "/dashboard/issuers";
    default:
      return "/dashboard/tenant";
  }
}

/**
 * The account's health: the share of what it needs set up to operate (the
 * API's checks), and each task still pending with why and the way to it. The
 * trust anchor's checks are its onboarding, in the order it can be done: the
 * first pending is marked as next.
 */
export async function Health() {
  const { t } = await getI18n();
  const copy = t.dashboard.health;
  const [health, tenant] = await Promise.all([fetchHealth(), fetchTenant()]);
  const ownMediator = tenant?.mediator?.own ? tenant.mediator.id : null;
  const anchor = tenant?.anchor ?? false;
  // A check this build has no words for is named, not described.
  const words = <T extends Record<string, string>>(
    from: T,
    check: HealthCheck,
  ): string | undefined => from[`${check.check}_${check.issue}`];
  const task = (check: HealthCheck) =>
    words(copy.tasks, check) ?? copy.checks[check.check];
  const reason = (check: HealthCheck) => words(copy.reasons, check);
  const next = anchor
    ? health?.checks.find((check) => !check.done)?.check
    : undefined;

  return (
    <Card className="mb-4 gap-0 px-6 py-5">
      <section>
        {health === null && (
          <h2 className="mb-3 text-[15px] font-semibold">{copy.title}</h2>
        )}
        {health === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t.dashboard.items.errors.unavailable}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-start gap-6 max-sm:flex-col max-sm:gap-3">
            <div className="flex flex-none flex-col items-center gap-2 max-sm:flex-row max-sm:gap-4">
              <RingGauge value={health.score} label={copy.title} />
              <p className="max-w-[14ch] text-center text-[13px] text-muted-foreground max-sm:text-left">
                {copy.done
                  .replace(
                    "{done}",
                    String(health.checks.filter((check) => check.done).length),
                  )
                  .replace("{all}", String(health.checks.length))}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 text-[15px] font-semibold">{copy.title}</h2>
              <ul>
                {health.checks.map((check) => (
                  <li key={check.check} className={rowClass}>
                    {check.done ? (
                      <span className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
                        <CheckIcon className="size-4 flex-none text-primary" />
                        {copy.checks[check.check]}
                      </span>
                    ) : (
                      <>
                        <span className="flex min-w-0 items-start gap-2.5">
                          <CircleIcon className="mt-0.5 size-4 flex-none text-faint" />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              {task(check)}
                              {check.check === next && (
                                <Badge variant="brand">{copy.next}</Badge>
                              )}
                            </span>
                            {reason(check) && (
                              <span className="mt-0.5 block text-[13px] text-muted-foreground">
                                {reason(check)}
                              </span>
                            )}
                          </span>
                        </span>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={taskHref(check, ownMediator)}>
                            {copy.fix}
                          </Link>
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </Card>
  );
}
