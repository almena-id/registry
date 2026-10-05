import type { Metadata } from "next";

import { Card } from "@/app/components/ui/card";
import { WalletRequest } from "@/app/components/WalletRequest";
import { getI18n } from "@/app/i18n/server";
import { DetailHead } from "../../[section]/[id]/Detail";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.wallet.linkTitle };
}

/** Linking an Almena wallet to the signed-in account. */
export default async function WalletLinkPage() {
  const { t } = await getI18n();
  const copy = t.wallet;

  return (
    <div>
      <DetailHead
        back="/dashboard/account"
        backLabel={t.dashboard.account.title}
      />
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {copy.linkTitle}
        </h1>
        <p className="text-muted-foreground">{copy.lead}</p>
      </header>
      <Card className="max-w-[400px] gap-0 p-6">
        <WalletRequest purpose="link" />
      </Card>
    </div>
  );
}
