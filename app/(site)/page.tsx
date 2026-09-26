import Link from "next/link";

import { getI18n } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";

export default async function Home() {
  const { t } = await getI18n();
  const user = await currentUser();
  const d = t.home.diagram;

  return (
    <div className="home">
      <section className="home__hero">
        <p className="eyebrow">{t.app.network}</p>
        <h1 className="home__title">{t.home.title}</h1>
        <p className="home__lead">{t.home.lead}</p>
        <div className="home__actions">
          {user ? (
            <Link className="button button--primary" href="/dashboard">
              {t.home.openDashboard}
            </Link>
          ) : (
            <Link className="button button--primary" href="/login">
              {t.home.signIn}
            </Link>
          )}
        </div>
      </section>

      {/* The registry's actual model, not an illustration of one. */}
      <figure className="model" aria-label={d.label}>
        <div className="model__node model__node--you">{d.you}</div>
        <div className="model__link" />
        <div className="model__node model__node--tenant">{d.tenant}</div>
        <div className="model__fan" />
        <div className="model__leaves">
          <div className="model__node">{d.issuers}</div>
          <div className="model__node">{d.verifiers}</div>
          <div className="model__node">{d.identities}</div>
        </div>
        <figcaption className="model__caption">{d.label}</figcaption>
      </figure>
    </div>
  );
}
