import type { Metadata } from "next";
import Link from "next/link";

import { getI18n } from "@/app/i18n/server";
import { fetchPage } from "@/app/lib/directory";
import { sections } from "@/app/lib/directory-types";
import { formatCount } from "@/app/lib/plural";
import { Attention } from "./Attention";
import { Health } from "./Health";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.overview.title };
}

export default async function DashboardPage() {
  const { locale, t } = await getI18n();
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
      <Health />

      {/* A frame the API could not answer for says nothing rather than a zero it cannot vouch for. */}
      <div className="mb-4 grid grid-cols-1 gap-4 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-4">
        {sections.map((key, index) => {
          const total = totals[index]?.total;
          return (
            <Link
              key={key}
              href={`/dashboard/${key}`}
              className="flex min-h-[132px] flex-col gap-6 rounded-2xl border bg-card p-5 text-card-foreground shadow-card transition-colors hover:border-input"
            >
              <h2 className="text-[15px] font-semibold">
                {t.dashboard.cards[key].title}
              </h2>
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
