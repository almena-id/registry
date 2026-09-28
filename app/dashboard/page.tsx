import type { Metadata } from "next";
import Link from "next/link";

import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { fetchPage } from "@/app/lib/directory";
import { sections } from "@/app/lib/directory-types";
import { formatDateTime } from "@/app/lib/format";
import { formatCount } from "@/app/lib/plural";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.overview.title };
}

export default async function DashboardPage() {
  const { locale, t } = await getI18n();
  // The layout has already sent anyone signed out to /login.
  const user = (await currentUser())!;
  const timeZone = await getTimeZone();
  // One item per section is enough to learn how many there are.
  const totals = await Promise.all(sections.map((s) => fetchPage(s, null, 1)));

  return (
    <div className="overview">
      <header className="page-head">
        <h1 className="page-head__title">{t.dashboard.overview.title}</h1>
        <p className="page-head__lead">{t.dashboard.overview.lead}</p>
      </header>

      {/* A frame the API could not answer for says nothing rather than a zero it cannot vouch for. */}
      <div className="overview__grid">
        {sections.map((key, index) => {
          const total = totals[index]?.total;
          return (
            <Link
              key={key}
              href={`/dashboard/${key}`}
              className="card stat stat--link"
            >
              <h2 className="stat__title">{t.dashboard.cards[key].title}</h2>
              {total ? (
                <p className="stat__count">
                  {formatCount(t.dashboard.sections[key].total, total, locale)}
                </p>
              ) : (
                <p className="stat__empty">
                  {total === 0 ? t.dashboard.cards[key].empty : "\u00a0"}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <section className="card account">
        <h2 className="account__title">{t.dashboard.account.title}</h2>
        <dl className="account__rows">
          <div>
            <dt>{t.dashboard.account.email}</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>{t.dashboard.account.since}</dt>
            <dd>
              <time dateTime={user.created_at}>
                {formatDateTime(user.created_at, locale, timeZone)}
              </time>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
