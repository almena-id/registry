import Link from "next/link";

import { getI18n, getTimeZone } from "@/app/i18n/server";
import { formatDateTime } from "@/app/lib/format";
import { ITEM, loadItem } from "../load";

/**
 * Summary: what the item is, to read. An identity's DID, who uses it and
 * where its document is published; an issuer's, verifier's or mediator's DID,
 * identity, description or address, mediator, status and publication.
 */
export default async function SummaryTab({
  params,
}: PageProps<"/dashboard/[section]/[id]">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded?.item) return null;
  const { locale, t } = await getI18n();
  const timeZone = await getTimeZone();
  const own = t.dashboard[ITEM[loaded.section]];
  const items = t.dashboard.items;
  const status = t.dashboard.publication;
  const created = (
    <div>
      <dt>{own.created}</dt>
      <dd>
        <time dateTime={loaded.item.created_at}>
          {formatDateTime(loaded.item.created_at, locale, timeZone)}
        </time>
      </dd>
    </div>
  );
  const publishedAt = (url: string | null) => (
    <div>
      <dt>{t.dashboard.identity.published}</dt>
      {url ? (
        <dd className="facts__mono">
          <a className="link" href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        </dd>
      ) : (
        <dd className="facts__empty">{status.notPublished}</dd>
      )}
    </div>
  );

  if (loaded.section === "identities") {
    const identity = loaded.item;
    return (
      <div className="card identity__card">
        <dl className="facts">
          <div>
            <dt>{own.did}</dt>
            <dd className="facts__mono">{identity.did}</dd>
          </div>
          <div>
            <dt>{t.dashboard.identity.usedBy}</dt>
            <dd>
              {identity.used_by.length === 0
                ? items.unused
                : identity.used_by
                    .map((use) => `${items.usedBy[use.kind]} · ${use.name}`)
                    .join(", ")}
            </dd>
          </div>
          {created}
          {publishedAt(identity.published ? identity.document_url : null)}
        </dl>
      </div>
    );
  }

  const item = loaded.item;
  const published = Boolean(item.published_at);
  return (
    <div className="card identity__card">
      <dl className="facts">
        <div>
          <dt>{own.did}</dt>
          <dd className="facts__mono">{item.did}</dd>
        </div>
        <div>
          <dt>{items.identity}</dt>
          <dd>
            <Link
              className="link"
              href={`/dashboard/identities/${item.identity.id}`}
            >
              {item.identity.name}
            </Link>
          </dd>
        </div>
        {loaded.section === "mediators" ? (
          <div>
            <dt>{items.url}</dt>
            <dd className="facts__mono">{item.url}</dd>
          </div>
        ) : (
          <>
            <div>
              <dt>{items.description}</dt>
              {item.description ? (
                <dd>{item.description}</dd>
              ) : (
                <dd className="facts__empty">—</dd>
              )}
            </div>
            <div>
              <dt>{items.mediator}</dt>
              {item.mediator ? (
                <dd>
                  <Link
                    className="link"
                    href={`/dashboard/mediators/${item.mediator.id}`}
                  >
                    {item.mediator.name}
                  </Link>
                </dd>
              ) : (
                <dd className="facts__empty">{items.noMediator}</dd>
              )}
            </div>
          </>
        )}
        <div>
          <dt>{status.status}</dt>
          <dd>
            <span
              className={`tag ${published ? "tag--published" : "tag--draft"}`}
            >
              {published ? status.published : status.draft}
            </span>
          </dd>
        </div>
        {created}
        {publishedAt(published ? item.document_url : null)}
      </dl>
    </div>
  );
}
