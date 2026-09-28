import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { fetchReview } from "@/app/lib/certification";
import type { Certification } from "@/app/lib/certification-types";
import { formatDateTime } from "@/app/lib/format";
import { Decision } from "./Decision";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/review/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getI18n();
  return {
    title:
      (await fetchReview(id))?.request.legal_name ?? t.dashboard.review.title,
  };
}

/** One request, beside what the tenant holds today, and the decision. */
export default async function ReviewItemPage({
  params,
}: PageProps<"/dashboard/review/[id]">) {
  const user = await currentUser();
  if (!user?.reviewer) notFound();
  const { id } = await params;
  const { locale, t } = await getI18n();
  const copy = t.dashboard.review;
  const cert = t.dashboard.certification;
  const [review, timeZone] = await Promise.all([
    fetchReview(id),
    getTimeZone(),
  ]);

  const facts = (item: Certification) => (
    <dl className="facts">
      <div>
        <dt>{cert.legalName}</dt>
        <dd>{item.legal_name ?? "—"}</dd>
      </div>
      <div>
        <dt>{cert.domain}</dt>
        <dd className="facts__mono">{item.domain ?? "—"}</dd>
      </div>
      <div>
        <dt>{cert.dnsTitle}</dt>
        <dd>{item.domain_verified ? cert.dnsVerified : cert.dnsPending}</dd>
      </div>
      <div>
        <dt>{cert.logo}</dt>
        <dd>
          {item.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="cert__logo cert__logo--large"
              src={item.logo}
              alt=""
            />
          ) : (
            "—"
          )}
        </dd>
      </div>
      {item.submitted_at && (
        <div>
          <dt>{copy.submitted}</dt>
          <dd>
            <time dateTime={item.submitted_at}>
              {formatDateTime(item.submitted_at, locale, timeZone)}
            </time>
          </dd>
        </div>
      )}
    </dl>
  );

  return (
    <div className="section identity">
      <Link className="link identity__back" href="/dashboard/review">
        ← {copy.title}
      </Link>

      {!review ? (
        <div className="card list list--empty">
          <p className="alert" role="alert">
            {copy.notFound}
          </p>
        </div>
      ) : (
        <>
          <header className="page-head">
            <h1 className="page-head__title">{review.request.legal_name}</h1>
            <p className="page-head__lead">
              {copy.tenant}: {review.tenant_name ?? copy.unnamed}
            </p>
          </header>

          <section className="card identity__card">
            <h2 className="identity__title">{copy.request}</h2>
            {facts(review.request)}
          </section>

          {review.current && (
            <section className="card identity__card">
              <h2 className="identity__title">{copy.inForce}</h2>
              {facts(review.current)}
            </section>
          )}

          {review.request.status === "in_review" ? (
            <Decision id={review.request.id} />
          ) : (
            <p className="notice" role="status">
              {cert.status[review.request.status]}
            </p>
          )}
        </>
      )}
    </div>
  );
}
