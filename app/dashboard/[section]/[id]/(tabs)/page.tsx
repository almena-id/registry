import Link from "next/link";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { label } from "@/app/lib/form-fields";
import { hasText } from "@/app/lib/texts";
import { currentTenant } from "@/app/lib/api";
import type { Signed } from "@/app/lib/directory-types";
import { formatDateTime } from "@/app/lib/format";
import { ITEM, loadItem } from "../load";

/** One fact: its name on the left, its value on the right. */
const FACT =
  "flex flex-wrap justify-between gap-2 border-t pt-3 text-sm first:border-t-0 first:pt-0";

/** A signature: signed is the brand's, pending waits, outdated warns. */
const SIGNATURE_BADGE = {
  signed: "brand",
  pending: "pending",
  outdated: "danger",
} as const;

/**
 * Summary: what the item is, to read. An identity's DID and where its
 * signature stands, who uses it and where its log is published; an issuer's,
 * verifier's or mediator's DID and signature, identity, description or
 * address, mediator, status and publication. Admins sign from here.
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
  const signature = t.dashboard.signature;
  // Signing is for whoever signs as the tenant under its flow, admin or not.
  const signs = Boolean((await currentTenant())?.signs);
  // The DID, then where its signature stands, with the way to sign it.
  const signed = (item: Signed) => (
    <>
      <div className={FACT}>
        <dt className="text-muted-foreground">{own.did}</dt>
        {item.did ? (
          <dd className="font-mono text-[13px] break-all">{item.did}</dd>
        ) : (
          <dd className="text-faint">{signature.noDid}</dd>
        )}
      </div>
      <div className={FACT}>
        <dt className="text-muted-foreground">{signature.title}</dt>
        <dd className="flex flex-wrap items-center gap-2.5">
          <Badge variant={SIGNATURE_BADGE[item.signature]}>
            {signature.status[item.signature]}
          </Badge>
          {signs && item.signature !== "signed" && (
            <Button asChild size="sm">
              <Link href={`/dashboard/${section}/${id}/sign`}>
                {signature.sign}
              </Link>
            </Button>
          )}
        </dd>
      </div>
    </>
  );
  const created = (
    <div className={FACT}>
      <dt className="text-muted-foreground">{own.created}</dt>
      <dd>
        <time dateTime={loaded.item.created_at}>
          {formatDateTime(loaded.item.created_at, locale, timeZone)}
        </time>
      </dd>
    </div>
  );
  const publishedAt = (url: string | null) => (
    <div className={FACT}>
      <dt className="text-muted-foreground">
        {t.dashboard.identity.published}
      </dt>
      {url ? (
        <dd className="font-mono text-[13px] break-all">
          <a
            className="text-primary hover:underline"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {url}
          </a>
        </dd>
      ) : (
        <dd className="text-faint">{status.notPublished}</dd>
      )}
    </div>
  );

  if (loaded.section === "identities") {
    const identity = loaded.item;
    return (
      <Card className="min-w-0 gap-0 p-5">
        <dl className="grid gap-3">
          {signed(identity)}
          <div className={FACT}>
            <dt className="text-muted-foreground">
              {t.dashboard.identity.usedBy}
            </dt>
            <dd>
              {identity.used_by.length === 0
                ? items.unused
                : identity.used_by
                    .map(
                      (use) =>
                        `${items.usedBy[use.kind]} · ${use.name || t.header.tenant.unnamed}`,
                    )
                    .join(", ")}
            </dd>
          </div>
          {created}
          {publishedAt(identity.published ? identity.log_url : null)}
        </dl>
      </Card>
    );
  }

  const item = loaded.item;
  const published = Boolean(item.published_at);
  return (
    <Card className="min-w-0 gap-0 p-5">
      <dl className="grid gap-3">
        {signed(item)}
        <div className={FACT}>
          <dt className="text-muted-foreground">{items.identity}</dt>
          <dd>
            <Link
              className="text-primary hover:underline"
              href={`/dashboard/identities/${item.identity.id}`}
            >
              {item.identity.name}
            </Link>
          </dd>
        </div>
        {loaded.section === "mediators" ? (
          <>
            <div className={FACT}>
              <dt className="text-muted-foreground">{items.url}</dt>
              <dd className="font-mono text-[13px] break-all">{item.url}</dd>
            </div>
            <div className={FACT}>
              <dt className="text-muted-foreground">{items.public}</dt>
              <dd>{item.public ? items.yes : items.no}</dd>
            </div>
          </>
        ) : (
          <>
            <div className={FACT}>
              <dt className="text-muted-foreground">{items.description}</dt>
              {hasText(item.description) ? (
                <dd>{label(item.description ?? {}, locale)}</dd>
              ) : (
                <dd className="text-faint">—</dd>
              )}
            </div>
            <div className={FACT}>
              <dt className="text-muted-foreground">{items.mediator}</dt>
              {/* Another account's public mediator does not open here. */}
              {item.mediator?.own ? (
                <dd>
                  <Link
                    className="text-primary hover:underline"
                    href={`/dashboard/mediators/${item.mediator.id}`}
                  >
                    {item.mediator.name}
                  </Link>
                </dd>
              ) : item.mediator ? (
                <dd>
                  {items.publicMediator.replace("{name}", item.mediator.name)}
                </dd>
              ) : (
                <dd className="text-faint">{items.noMediator}</dd>
              )}
            </div>
          </>
        )}
        <div className={FACT}>
          <dt className="text-muted-foreground">{status.status}</dt>
          <dd>
            <Badge variant={published ? "brand" : "muted"}>
              {published ? status.published : status.draft}
            </Badge>
          </dd>
        </div>
        {created}
        {publishedAt(published ? item.log_url : null)}
        {/* Its tenant's endorsement: its whois.vp, and until when it holds. */}
        <div className={FACT}>
          <dt className="text-muted-foreground">{status.endorsement}</dt>
          {item.whois_url && item.endorsed_until ? (
            <dd className="font-mono text-[13px] break-all">
              <a
                className="text-primary hover:underline"
                href={item.whois_url}
                target="_blank"
                rel="noreferrer"
              >
                {item.whois_url}
              </a>{" "}
              ·{" "}
              {status.endorsedUntil.replace(
                "{date}",
                formatDateTime(item.endorsed_until, locale, timeZone),
              )}
            </dd>
          ) : (
            <dd className="text-faint">{status.notEndorsed}</dd>
          )}
        </div>
      </dl>
    </Card>
  );
}
