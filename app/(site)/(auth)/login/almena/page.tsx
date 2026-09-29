import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { WalletRequest } from "@/app/components/WalletRequest";
import { getI18n } from "@/app/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.wallet.signInTitle };
}

/** Signing in with the Almena wallet: no email needed. */
export default async function WalletLoginPage() {
  const { t } = await getI18n();
  const copy = t.wallet;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-[400px] gap-[18px] px-7 py-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-[-0.015em]">{copy.signInTitle}</h1>
          <p className="text-[15px] wrap-anywhere text-muted-foreground">{copy.lead}</p>
        </div>
        <WalletRequest purpose="sign_in" />
        <div className="flex flex-wrap justify-between gap-2">
          <Button asChild variant="link" className="h-auto p-0">
            <Link href="/login">{copy.other}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
