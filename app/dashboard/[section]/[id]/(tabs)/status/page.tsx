import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { formatDateTime } from "@/app/lib/format";
import { fetchStatusLists } from "@/app/lib/status-lists";
import { loadItem } from "../../load";

const fact =
  "flex flex-wrap justify-between gap-x-3 gap-y-1 border-t pt-2.5 text-sm first:border-t-0 first:pt-0";

/**
 * Status lists: where verifiers check whether the issuer's credentials still
 * hold — each list's address, how many of its entries are taken, revoked and
 * suspended, and whether it is signed. Its signer signs one before the first
 * credential, and again when it was signed with a key the issuer's DID no
 * longer lists; everyone else reads. Issuers only.
 */
export default async function IssuerStatusTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/status">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded || loaded.section !== "issuers") notFound();
  if (!loaded.item) return null;
  const [{ t, locale }, lists, timeZone] = await Promise.all([
    getI18n(),
    fetchStatusLists(id),
    getTimeZone(),
  ]);
  const copy = t.dashboard.statusLists;

  if (!lists)
    return (
      <Card className="min-w-0 gap-0 p-5">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.unavailable}</AlertDescription>
        </Alert>
      </Card>
    );

  const who = lists.can_sign
    ? null
    : lists.signer_needed
      ? copy.signerNeeded
      : copy.notTheSigner;
  const signHref = (list?: string) =>
    `/dashboard/issuers/${id}/sign-status${list ? `?list=${encodeURIComponent(list)}` : ""}`;

  return (
    <div className="grid gap-4">
      <Card className="gap-3 p-5">
        <p className="text-sm text-muted-foreground">{copy.lead}</p>
        {lists.items.length === 0 && (
          <>
            <p className="text-sm">{copy.empty}</p>
            {lists.can_sign ? (
              <Button asChild className="justify-self-start">
                <Link href={signHref()}>{copy.signFirst}</Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{who}</p>
            )}
          </>
        )}
      </Card>
      {lists.items.map((list) => (
        <Card key={list.id} className="gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-[13px] font-semibold">{list.slug}</h2>
            <Badge variant={list.needs_signing ? "pending" : "brand"}>
              {list.needs_signing ? copy.toSign : copy.signed}
            </Badge>
          </div>
          <dl className="grid gap-2.5">
            <div className={fact}>
              <dt className="text-muted-foreground">{copy.address}</dt>
              <dd className="font-mono text-[12px] break-all">{list.uri}</dd>
            </div>
            <div className={fact}>
              <dt className="text-muted-foreground">{copy.entries}</dt>
              <dd className="tabular-nums">
                {copy.taken
                  .replace("{used}", list.used.toLocaleString(locale))
                  .replace("{size}", list.size.toLocaleString(locale))}
              </dd>
            </div>
            <div className={fact}>
              <dt className="text-muted-foreground">{copy.revoked}</dt>
              <dd className="tabular-nums">{list.revoked.toLocaleString(locale)}</dd>
            </div>
            <div className={fact}>
              <dt className="text-muted-foreground">{copy.suspended}</dt>
              <dd className="tabular-nums">
                {list.suspended.toLocaleString(locale)}
              </dd>
            </div>
            <div className={fact}>
              <dt className="text-muted-foreground">{copy.signed}</dt>
              <dd>
                {list.signed_at
                  ? formatDateTime(list.signed_at, locale, timeZone)
                  : copy.notSigned}
              </dd>
            </div>
          </dl>
          {list.needs_signing && (
            <>
              {list.signed_at && (
                <Alert variant="notice">
                  <AlertDescription>{copy.resign}</AlertDescription>
                </Alert>
              )}
              {lists.can_sign ? (
                <Button asChild className="justify-self-start">
                  <Link href={signHref(list.id)}>{copy.sign}</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{who}</p>
              )}
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
