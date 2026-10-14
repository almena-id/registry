import { CheckIcon, CircleIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { getI18n } from "@/app/i18n/server";
import { fetchHealth, fetchTenant, type HealthCheck } from "@/app/lib/tenant";

const rowClass =
  "flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0";

/**
 * Where each task is done: on the thing it names (`item`) when there is one —
 * the account's identity to sign, its mediator to sign or publish — else where
 * it is set. An own mediator waiting to be published opens itself.
 */
function taskHref(
  check: HealthCheck,
  ownMediator: string | null,
  anchor: boolean,
): string {
  switch (check.check) {
    case "signing_flow":
      return "/dashboard/signing";
    case "domain":
      return check.issue === "missing"
        ? "/dashboard/domains/new"
        : "/dashboard/domains";
    case "identity":
      return check.item
        ? `/dashboard/identities/${check.item}/sign`
        : "/dashboard/tenant";
    case "mediator": {
      const mediator = check.item ?? ownMediator;
      if (check.issue === "missing" && anchor)
        return "/dashboard/mediators/new";
      if (check.issue === "unsigned" && mediator)
        return `/dashboard/mediators/${mediator}/sign`;
      if (check.issue === "unpublished" && mediator)
        return `/dashboard/mediators/${mediator}`;
      return "/dashboard/tenant";
    }
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
  // A check this build has no words for is named, not described.
  const task = (check: HealthCheck) =>
    copy.tasks[`${check.check}_${check.issue}` as keyof typeof copy.tasks] ??
    copy.checks[check.check];
  const reason = (check: HealthCheck): string | undefined =>
    copy.reasons[`${check.check}_${check.issue}` as keyof typeof copy.reasons];
  const anchor = tenant?.anchor ?? false;
  const next = anchor
    ? health?.checks.find((check) => !check.done)?.check
    : undefined;

  return (
    <Card className="mb-4 gap-0 px-6 py-5">
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold">{copy.title}</h2>
          {health && (
            <p className="text-[22px] font-[650] tracking-[-0.01em]">
              {health.score}%
            </p>
          )}
        </div>
        {health === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t.dashboard.items.errors.unavailable}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Progress
              className="mb-3 bg-sunk"
              aria-label={copy.title}
              value={health.score}
            />
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
                        <Link href={taskHref(check, ownMediator, anchor)}>
                          {copy.fix}
                        </Link>
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </Card>
  );
}
