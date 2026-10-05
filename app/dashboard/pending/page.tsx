import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchPending } from "@/app/lib/pending";
import { PendingRows } from "../PendingRows";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.pending.title };
}

/**
 * Pending: everything in the account that waits to be signed or published —
 * identities' DIDs, issuers, verifiers and mediators, issuers' status lists
 * and the credentials of accepted applications — in the order it is done.
 */
export default async function PendingPage() {
  const [{ t }, rows] = await Promise.all([getI18n(), fetchPending()]);
  const copy = t.dashboard.pending;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.hint}</p>
      </header>
      <Card className="gap-0 px-6 py-5">
        {rows === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t.dashboard.items.errors.unavailable}
            </AlertDescription>
          </Alert>
        ) : (
          <PendingRows rows={rows} back="/dashboard/pending" />
        )}
      </Card>
    </div>
  );
}
