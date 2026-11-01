import { ChartColumnIcon } from "lucide-react";
import Link from "next/link";

import { Donut } from "@/app/components/charts/Donut";
import { StackedBars } from "@/app/components/charts/StackedBars";
import { EmptyState } from "@/app/components/EmptyState";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchActivity } from "@/app/lib/activity";
import {
  ACTIVITY_SPANS,
  activityTotals,
  hasActivity,
  type ActivitySpan,
} from "@/app/lib/activity-days";
import { formatDay } from "@/app/lib/format";
import { cn } from "cn";

const tile =
  "flex min-w-0 flex-col gap-2 rounded-xl border bg-background/40 px-4 py-3.5";

/**
 * What the tenant's issuers and verifiers did (`GET /tenants/{id}/activity`):
 * applications submitted, credentials issued and presentations verified per
 * day over the span the URL keeps (`?days=` 7, 30 or 90), what went wrong
 * marked above each day; then where things stand — applications waiting, to
 * issue, the credentials issued by status and the verifications. Nothing yet
 * is drawn as such, not as a flat chart.
 */
export async function Activity({ days }: { days: ActivitySpan }) {
  const { t, locale } = await getI18n();
  const copy = t.dashboard.activity;
  const activity = await fetchActivity(days);
  const number = new Intl.NumberFormat(locale);

  const header = (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold">{copy.title}</h2>
        <p className="text-[13px] text-muted-foreground">{copy.lead}</p>
      </div>
      <nav
        className="inline-flex rounded-lg border bg-sunk p-0.5"
        aria-label={copy.span}
      >
        {ACTIVITY_SPANS.map((span) => (
          <Link
            key={span}
            href={span === 30 ? "/dashboard" : `/dashboard?days=${span}`}
            scroll={false}
            aria-current={span === days ? "page" : undefined}
            className="rounded-md px-2.5 py-1 text-[13px] text-muted-foreground hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:font-semibold aria-[current=page]:text-foreground aria-[current=page]:shadow-card"
          >
            {copy.spans[String(span) as keyof typeof copy.spans]}
          </Link>
        ))}
      </nav>
    </div>
  );

  if (activity === null)
    return (
      <Card className="mb-4 gap-0 px-6 py-5">
        <section>
          {header}
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t.dashboard.items.errors.unavailable}
            </AlertDescription>
          </Alert>
        </section>
      </Card>
    );

  if (!hasActivity(activity))
    return (
      <Card className="mb-4 gap-0 px-6 py-5">
        <section>
          {header}
          <EmptyState
            icon={ChartColumnIcon}
            title={copy.empty}
            className="py-6"
          />
        </section>
      </Card>
    );

  const totals = activityTotals(activity.days);
  const fill = (text: string, values: Record<string, number>) =>
    Object.entries(values).reduce(
      (all, [key, value]) => all.replace(`{${key}}`, number.format(value)),
      text,
    );
  const statuses = t.dashboard.applications.credentialStatuses;
  const { applications, credentials, verifications } = activity;

  return (
    <Card className="mb-4 gap-0 px-6 py-5">
      <section>
        {header}
        <p className="sr-only">{fill(copy.summary, { days, ...totals })}</p>
        <StackedBars
          locale={locale}
          label={fill(copy.chartLabel, { days })}
          dayHeader={copy.day}
          data={activity.days.map(({ date, ...values }) => ({
            key: date,
            label: formatDay(date, locale),
            short: formatDay(date, locale, "short"),
            values,
          }))}
          series={[
            {
              key: "submitted",
              label: copy.series.submitted,
              fill: "fill-chart-submitted",
              swatch: "bg-chart-submitted",
            },
            {
              key: "issued",
              label: copy.series.issued,
              fill: "fill-chart-issued",
              swatch: "bg-chart-issued",
            },
            {
              key: "verified",
              label: copy.series.verified,
              fill: "fill-chart-verified",
              swatch: "bg-chart-verified",
            },
          ]}
          marks={[
            { key: "rejected", label: copy.series.rejected },
            { key: "failed", label: copy.series.failed },
          ]}
          markLabel={copy.series.wrong}
          markClass="fill-destructive"
          markSwatch="bg-destructive"
        />

        <div className="mt-5 grid gap-3 min-[700px]:grid-cols-2 min-[1400px]:grid-cols-4">
          <Link
            href="/dashboard/applications"
            className={cn(tile, "transition-colors hover:border-input")}
          >
            <span className="text-[13px] text-muted-foreground">
              {copy.waiting}
            </span>
            <span className="font-brand text-[26px] leading-none font-semibold tabular-nums">
              {number.format(applications.submitted)}
            </span>
            <span className="text-xs text-faint">{copy.waitingHint}</span>
          </Link>
          <Link
            href="/dashboard/pending"
            className={cn(tile, "transition-colors hover:border-input")}
          >
            <span className="text-[13px] text-muted-foreground">
              {copy.toIssue}
            </span>
            <span className="font-brand text-[26px] leading-none font-semibold tabular-nums">
              {number.format(applications.accepted)}
            </span>
            <span className="text-xs text-faint">
              {fill(copy.issuedSoFar, { count: applications.issued })}
            </span>
          </Link>
          <div className={tile}>
            <span className="text-[13px] text-muted-foreground">
              {copy.credentials}
            </span>
            <div className="flex items-center gap-4">
              <Donut
                size={72}
                label={copy.credentials}
                slices={(["valid", "suspended", "revoked"] as const).map(
                  (key) => ({
                    key,
                    label: statuses[key],
                    value: credentials[key],
                    stroke: {
                      valid: "stroke-primary",
                      suspended: "stroke-warning",
                      revoked: "stroke-destructive",
                    }[key],
                    swatch: {
                      valid: "bg-primary",
                      suspended: "bg-warning",
                      revoked: "bg-destructive",
                    }[key],
                  }),
                )}
              />
              <Legend
                rows={[
                  ["bg-primary", statuses.valid, credentials.valid],
                  ["bg-warning", statuses.suspended, credentials.suspended],
                  ["bg-destructive", statuses.revoked, credentials.revoked],
                ]}
                number={number}
              />
            </div>
          </div>
          <div className={tile}>
            <span className="text-[13px] text-muted-foreground">
              {copy.verifications}
            </span>
            <div className="flex items-center gap-4">
              <Donut
                size={72}
                label={copy.verifications}
                slices={[
                  {
                    key: "verified",
                    label: copy.verified,
                    value: verifications.verified,
                    stroke: "stroke-chart-verified",
                    swatch: "bg-chart-verified",
                  },
                  {
                    key: "failed",
                    label: copy.failed,
                    value: verifications.failed,
                    stroke: "stroke-destructive",
                    swatch: "bg-destructive",
                  },
                ]}
              />
              <Legend
                rows={[
                  ["bg-chart-verified", copy.verified, verifications.verified],
                  ["bg-destructive", copy.failed, verifications.failed],
                ]}
                number={number}
              />
            </div>
          </div>
        </div>
      </section>
    </Card>
  );
}

/** A donut's parts named, each with its colour and number. */
function Legend({
  rows,
  number,
}: {
  rows: [string, string, number][];
  number: Intl.NumberFormat;
}) {
  return (
    <ul className="grid min-w-0 flex-1 gap-0.5 text-[13px]">
      {rows.map(([swatch, name, value]) => (
        <li key={name} className="flex items-center gap-1.5">
          <span
            className={cn("size-2 flex-none rounded-full", swatch)}
            aria-hidden
          />
          {/* A long name wraps rather than hiding: it says what the number is. */}
          <span className="min-w-0 wrap-anywhere text-muted-foreground">
            {name}
          </span>
          <span className="ml-auto flex-none pl-2 tabular-nums">
            {number.format(value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
