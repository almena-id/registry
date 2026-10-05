import type { Metadata } from "next";

import { WalletScreen } from "@/app/dashboard/WalletScreen";
import { getI18n } from "@/app/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.wallet.linkTitle };
}

/** Linking an Almena wallet to the signed-in account. */
export default async function WalletLinkPage() {
  const { t } = await getI18n();
  const copy = t.wallet;

  return (
    <WalletScreen
      back="/dashboard/account"
      backLabel={t.dashboard.account.title}
      title={copy.linkTitle}
      lead={copy.lead}
      purpose="link"
    />
  );
}
