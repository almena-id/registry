import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TrashIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { moveCookie, noMove } from "@/app/lib/session";
import { moveAccount } from "@/app/lib/ways-in-actions";
import { DetailHead } from "../../[section]/[id]/Detail";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.account.taken.title };
}

/**
 * A way in being linked belongs to another account. It stays there; an
 * account that holds nothing yet may be deleted to continue in that one — a
 * decision of its own, on its own screen.
 */
export default async function TakenPage() {
  const { t } = await getI18n();
  const copy = t.dashboard.account.taken;
  const kept = (await cookies()).get(moveCookie)?.value;
  if (!kept) redirect("/dashboard/account");
  const ticket = kept === noMove ? null : kept;

  return (
    <div className="grid gap-4">
      <DetailHead back="/dashboard/account" backLabel={t.dashboard.account.title} />
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
      </header>
      <Card className="gap-0 p-5">
        <p className="mb-4 text-muted-foreground">{ticket ? copy.emptyLead : copy.busyLead}</p>
        <form action={moveAccount}>
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost">
              <Link href="/dashboard/account">{ticket ? copy.cancel : copy.back}</Link>
            </Button>
            {ticket && (
              <Button variant="danger" type="submit">
                <TrashIcon />
                {copy.move}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
