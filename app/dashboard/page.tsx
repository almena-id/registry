import type { Metadata } from "next";
import Link from "next/link";

import { ArrowUpRightIcon } from "lucide-react";

import { getI18n } from "@/app/i18n/server";
import { activitySpan } from "@/app/lib/activity-days";
import { fetchPage } from "@/app/lib/directory";
import { sections } from "@/app/lib/directory-types";
import { formatCount } from "@/app/lib/plural";
import { Activity } from "./Activity";
import { Attention } from "./Attention";
import { Health } from "./Health";
import { SECTION_ICONS } from "./icons";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.overview.title };
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { locale, t } = await getI18n();
  const days = activitySpan((await searchParams).days);
  // One item per section is enough to learn how many there are.
  const totals = await Promise.all(sections.map((s) => fetchPage(s, null, 1)));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {t.dashboard.overview.title}
        </h1>
        <p className="text-muted-foreground">{t.dashboard.overview.lead}</p>
      </header>

      <Attention />
      <Activity days={days} />
      <Health />

      {/* A frame the API could not answer for says nothing rather than a zero it cannot vouch for. */}
      <div className="mb-4 grid grid-cols-1 gap-4 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-4">
        {sections.map((key, index) => {
          const total = totals[index]?.total;
          const Icon = SECTION_ICONS[key];
          return (
            <Link
              key={key}
              href={`/dashboard/${key}`}
              className="group relative isolate flex min-h-[132px] flex-col gap-6 overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-card transition-colors hover:border-input"
            >
              {/* The section's icon again, large and faint, in the corner. */}
              <Icon
                className="absolute -right-5 -bottom-5 -z-10 size-28 text-primary opacity-[0.06] transition-transform duration-300 group-hover:scale-105"
                strokeWidth={1.25}
                aria-hidden
              />
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[10px] bg-brand-soft text-primary">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <h2 className="text-[15px] font-semibold">
                    {t.dashboard.cards[key].title}
                  </h2>
                </span>
                <ArrowUpRightIcon
                  className="size-4 text-faint transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </div>
              {total ? (
                <p className="mt-auto text-[22px] font-[650] tracking-[-0.01em]">
                  {formatCount(t.dashboard.sections[key].total, total, locale)}
                </p>
              ) : (
                <p className="mt-auto text-sm text-faint">
                  {total === 0 ? t.dashboard.cards[key].empty : "\u00a0"}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
