import type { Metadata } from "next";

import { BadgeCheckIcon } from "@/app/components/icons";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenants } from "@/app/lib/api";
import { fetchCertification } from "@/app/lib/certification";
import { formatDateTime } from "@/app/lib/format";
import { RequestForm } from "./RequestForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.certification.title };
}

/**
 * The current tenant's certification by Almena: the one in force, and the
 * request being worked on. Admins fill it in; members see it.
 */
export default async function CertificationPage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.certification;
  const [state, tenants, timeZone] = await Promise.all([
    fetchCertification(),
    currentTenants(),
    getTimeZone(),
  ]);
  const current = state?.current ?? null;

  return (
    <div className="section">
      <header className="page-head">
        <h1 className="page-head__title">{copy.title}</h1>
        <p className="page-head__lead">{copy.lead}</p>
      </header>

      {state === null ? (
        <div className="card list list--empty">
          <p className="alert" role="alert">
            {copy.errors.unavailable}
          </p>
        </div>
      ) : (
        <>
          <section className={current ? "card cert" : "card cert cert--empty"}>
            {current ? (
              <div className="cert__current">
                {current.logo && (
                  // A data: URL the API checked; next/image adds nothing here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="cert__logo" src={current.logo} alt="" />
                )}
                <div className="cert__who">
                  <span className="cert__name">{current.legal_name}</span>
                  <span className="cert__domain">{current.domain}</span>
                </div>
                <span className="tag tag--certified">
                  <BadgeCheckIcon size={12} />
                  {copy.certified}
                </span>
                {current.reviewed_at && (
                  <time className="list__date" dateTime={current.reviewed_at}>
                    {formatDateTime(current.reviewed_at, locale, timeZone)}
                  </time>
                )}
              </div>
            ) : (
              <p>{copy.notCertified}</p>
            )}
          </section>

          <RequestForm
            request={state.request}
            current={current}
            admin={tenants[0]?.role === "admin"}
          />
        </>
      )}
    </div>
  );
}
