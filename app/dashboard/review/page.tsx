import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { fetchPending } from "@/app/lib/certification";
import { formatDateTime } from "@/app/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.review.title };
}

/** Almena's reviewers: the requests waiting, oldest first. */
export default async function ReviewPage() {
  const user = await currentUser();
  if (!user?.reviewer) notFound();
  const { locale, t } = await getI18n();
  const copy = t.dashboard.review;
  const [pending, timeZone] = await Promise.all([
    fetchPending(),
    getTimeZone(),
  ]);

  return (
    <div className="section">
      <header className="page-head">
        <h1 className="page-head__title">{copy.title}</h1>
        <p className="page-head__lead">{copy.lead}</p>
      </header>

      {pending === null ? (
        <div className="card list list--empty">
          <p className="alert" role="alert">
            {t.dashboard.certification.errors.unavailable}
          </p>
        </div>
      ) : pending.length === 0 ? (
        <div className="card list list--empty">
          <p className="list__empty">{copy.empty}</p>
        </div>
      ) : (
        <div className="card list">
          <ul className="list__rows">
            {pending.map((item) => (
              <li key={item.id} className="list__row">
                <div className="list__main">
                  <Link
                    className="list__name list__link"
                    href={`/dashboard/review/${item.id}`}
                  >
                    {item.legal_name}
                  </Link>
                  <span className="list__description list__mono">
                    {item.domain}
                  </span>
                  <span className="list__tags">
                    <span className="tag">
                      {item.tenant_name ?? copy.unnamed}
                    </span>
                  </span>
                </div>
                {item.submitted_at && (
                  <time
                    className="list__date"
                    dateTime={item.submitted_at}
                    title={copy.submitted}
                  >
                    {formatDateTime(item.submitted_at, locale, timeZone)}
                  </time>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
