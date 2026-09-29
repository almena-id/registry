import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchWaiting } from "@/app/lib/directory";
import { fetchWaysIn } from "@/app/lib/ways-in";

const rowClass =
  "flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0";

const signatureBadge = { pending: "pending", outdated: "danger" } as const;

/** How many waiting identities are named before "and N more". */
const SHOWN = 5;

/**
 * What waits for somebody in this tenant: identities whose DID is pending or
 * has changes to sign, and —
 * for an admin without one — the wallet that signing needs. Admins get the
 * way to act on each; members see what waits. Drawn even when nothing does.
 */
export async function Attention() {
  const { t } = await getI18n();
  const copy = t.dashboard.attention;
  const [waiting, waysIn, tenant] = await Promise.all([
    fetchWaiting(),
    fetchWaysIn(),
    currentTenant(),
  ]);
  const admin = tenant?.role === "admin";
  const noWallet =
    admin &&
    waysIn !== null &&
    !waysIn.accounts.some((a) => a.provider === "almena");
  const rows = waiting ?? [];
  const nothing = !noWallet && rows.length === 0;

  return (
    <Card className="mb-4 gap-0 px-6 py-5">
      <section>
        <h2 className="mb-1 text-[15px] font-semibold">{copy.title}</h2>
        {waiting === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t.dashboard.items.errors.unavailable}
            </AlertDescription>
          </Alert>
        ) : nothing ? (
          <p className="text-faint">{copy.nothing}</p>
        ) : (
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
            {rows.slice(0, SHOWN).map((row) => (
              <li key={row.id} className={rowClass}>
                <span className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <Button asChild variant="link" className="h-auto p-0">
                    <Link href={`/dashboard/identities/${row.id}`}>
                      {row.name || t.header.tenant.unnamed}
                    </Link>
                  </Button>
                  <Badge variant={signatureBadge[row.signature]}>
                    {t.dashboard.signature.status[row.signature]}
                  </Badge>
                </span>
                {admin && !noWallet && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/identities/${row.id}/sign`}>
                      {t.dashboard.signature.sign}
                    </Link>
                  </Button>
                )}
              </li>
            ))}
            {rows.length > SHOWN && (
              <li className={rowClass}>
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href="/dashboard/identities">
                    {copy.more.replace("{count}", String(rows.length - SHOWN))}
                  </Link>
                </Button>
              </li>
            )}
          </ul>
        )}
      </section>
    </Card>
  );
}
