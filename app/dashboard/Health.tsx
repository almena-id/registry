import { CheckIcon, CircleIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { getI18n } from "@/app/i18n/server";
import { fetchHealth, fetchTenant, type HealthCheck } from "@/app/lib/tenant";

const rowClass =
  "flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0";

/** Where each task is done. An own mediator waiting to be published opens itself. */
function taskHref(check: HealthCheck, ownMediator: string | null): string {
  if (check.check === "signing_flow") return "/dashboard/signing";
  if (check.issue === "unpublished" && ownMediator)
    return `/dashboard/mediators/${ownMediator}`;
  return "/dashboard/tenant";
}

/**
 * The account's health: the share of what it needs set up to operate (the
 * API's checks), and each task still pending with the way to it.
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
                      <span className="flex min-w-0 items-center gap-2.5">
                        <CircleIcon className="size-4 flex-none text-faint" />
                        {task(check)}
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
          </>
        )}
      </section>
    </Card>
  );
}
