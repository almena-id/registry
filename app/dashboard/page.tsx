import type { Metadata } from "next";

import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.overview.title };
}

const cards = ["tenants", "issuers", "verifiers", "identities"] as const;

export default async function DashboardPage() {
  const { locale, t } = await getI18n();
  // The layout has already sent anyone signed out to /login.
  const user = (await currentUser())!;
  const timeZone = await getTimeZone();

  return (
    <div className="overview">
      <header className="page-head">
        <h1 className="page-head__title">{t.dashboard.overview.title}</h1>
        <p className="page-head__lead">{t.dashboard.overview.lead}</p>
      </header>

      {/* Nothing is counted yet: each frame says so rather than showing a zero it cannot vouch for. */}
      <div className="overview__grid">
        {cards.map((key) => (
          <section key={key} className="card stat">
            <h2 className="stat__title">{t.dashboard.cards[key].title}</h2>
            <p className="stat__empty">{t.dashboard.cards[key].empty}</p>
          </section>
        ))}
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
