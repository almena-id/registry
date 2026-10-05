import Link from "next/link";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchTenantCredentialCatalogue } from "@/app/lib/credential-catalog";
import { label } from "@/app/lib/form-fields";
import type { Pending } from "@/app/lib/pending";
import { fetchWaysIn } from "@/app/lib/ways-in";

const rowClass =
  "flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0";

const stateBadge = {
  pending: "pending",
  outdated: "danger",
  draft: "muted",
  expired: "danger",
  unsigned: "pending",
  accepted: "brand",
} as const;

/** Where each row opens: the thing itself, a status list on its issuer's tab. */
function openHref(row: Pending): string {
  switch (row.kind) {
    case "identity":
      return `/dashboard/identities/${row.id}`;
    case "status_list":
      return `/dashboard/issuers/${row.issuer?.id}/status`;
    case "credential":
      return `/dashboard/applications/${row.id}`;
    default:
      return `/dashboard/${row.kind}s/${row.id}`;
  }
}

/** Signing an issuer's status list, `list` or its current one (made if none). */
function signStatusHref(issuer: string, back: string, list?: string): string {
  const query = new URLSearchParams(list ? { list, back } : { back });
  return `/dashboard/issuers/${issuer}/sign-status?${query}`;
}

/**
 * Where each is done. A credential's claims are settled on its application
 * before it is signed, so it opens there.
 */
function actionHref(row: Pending, back: string): string {
  switch (row.kind) {
    case "identity":
      return `/dashboard/identities/${row.id}/sign`;
    case "status_list":
      return signStatusHref(row.issuer?.id ?? "", back, row.id);
    case "credential":
      return `/dashboard/applications/${row.id}`;
    default:
      return `/dashboard/${row.kind}s/${row.id}/publish`;
  }
}

/**
 * What waits in the tenant to be signed or published (the API's
 * `GET /tenants/{id}/pending`), in the order it is done: each named and
 * tagged with why it waits; for whoever does it, the way to it — or, when
 * something has to be done first, what. Whoever signs without an Almena
 * wallet is asked to link one first. `limit` shows that many, then how many
 * more, leading to the whole list.
 */
export async function PendingRows({
  rows,
  back,
  limit,
}: {
  rows: Pending[];
  /** Where a status list's signature returns to. */
  back: string;
  limit?: number;
}) {
  const [{ t, locale }, tenant, waysIn, credentials] = await Promise.all([
    getI18n(),
    currentTenant(),
    fetchWaysIn(),
    rows.some((row) => row.kind === "credential")
      ? fetchTenantCredentialCatalogue()
      : null,
  ]);
  const copy = t.dashboard.pending;
  const types = new Map(
    credentials?.types.map((type) => [type.id, type.labels]),
  );
  const noWallet =
    (Boolean(tenant?.signs) || rows.some((row) => row.yours)) &&
    waysIn !== null &&
    !waysIn.accounts.some((a) => a.provider === "almena");
  const shown = limit === undefined ? rows : rows.slice(0, limit);

  if (!noWallet && rows.length === 0)
    return <p className="text-faint">{copy.empty}</p>;

  const name = (row: Pending) => {
    if (row.kind === "status_list") return row.issuer?.name ?? row.name;
    if (row.kind === "credential" && row.credential_type) {
      const labels = types.get(row.credential_type);
      return labels ? label(labels, locale) : row.credential_type;
    }
    return row.name || t.header.tenant.unnamed;
  };
  const state = (row: Pending) =>
    row.kind === "status_list" && row.state === "outdated"
      ? copy.states.resign
      : copy.states[row.state];

  const blocked = (row: Pending) => {
    const text = row.blocked_by && copy.blocked[row.blocked_by];
    const issuer = row.issuer?.id;
    // What comes first, linked where it is done and the asker may do it.
    const href =
      issuer && row.blocked_by === "signer_needed"
        ? `/dashboard/issuers/${issuer}/signing`
        : issuer && row.blocked_by === "status_list_unsigned" && row.yours
          ? signStatusHref(issuer, back)
          : null;
    return href ? (
      <Button asChild variant="link" size="sm" className="h-auto p-0">
        <Link href={href}>{text}</Link>
      </Button>
    ) : (
      <span className="text-sm text-muted-foreground">{text}</span>
    );
  };

  return (
    <ul>
      {noWallet && (
        <li className={rowClass}>
          <span className="flex min-w-0 flex-wrap items-center gap-2.5">
            {copy.noWallet}
          </span>
          <Button asChild size="sm">
            <Link href="/dashboard/account/almena">{copy.linkWallet}</Link>
          </Button>
        </li>
      )}
      {shown.map((row) => (
        <li key={`${row.kind}-${row.id}`} className={rowClass}>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <Button asChild variant="link" className="h-auto p-0">
              <Link href={openHref(row)}>{name(row)}</Link>
            </Button>
            <span className="text-[13px] text-muted-foreground">
              {copy.kinds[row.kind]}
              {row.kind === "credential" && row.issuer && (
                <> · {row.issuer.name}</>
              )}
            </span>
            <Badge variant={stateBadge[row.state]}>{state(row)}</Badge>
          </span>
          {row.blocked_by
            ? blocked(row)
            : row.yours &&
              !noWallet && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={actionHref(row, back)}>
                    {row.kind === "credential"
                      ? copy.actions.issue
                      : copy.actions[row.action]}
                  </Link>
                </Button>
              )}
        </li>
      ))}
      {rows.length > shown.length && (
        <li className={rowClass}>
          <Button asChild variant="link" className="h-auto p-0">
            <Link href="/dashboard/pending">
              {copy.more.replace("{count}", String(rows.length - shown.length))}
            </Link>
          </Button>
        </li>
      )}
    </ul>
  );
}
