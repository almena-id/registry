import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { WalletScreen } from "@/app/dashboard/WalletScreen";
import { getI18n } from "@/app/i18n/server";
import { fetchIssuance, fetchReceivedOne } from "@/app/lib/applications";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.applications.signTitle };
}

/**
 * Signing a credential: the issuer's signer's wallet signs the SD-JWT VC the
 * registry built from the settled claims — the wallet shows them first —
 * and the application is issued. Only for that signer.
 */
export default async function IssuePage({
  params,
}: PageProps<"/dashboard/applications/[id]/issue">) {
  const { id } = await params;
  const back = `/dashboard/applications/${id}`;
  const [{ t }, item, proposal] = await Promise.all([
    getI18n(),
    fetchReceivedOne(id),
    fetchIssuance(id),
  ]);
  if (!item) notFound();
  if (!proposal?.can_sign) redirect(back);
  const copy = t.dashboard.applications;
  return (
    <WalletScreen
      back={back}
      backLabel={copy.one}
      title={copy.signTitle}
      lead={copy.signLead}
      purpose="sign"
      target={{ kind: "credential", id, back }}
    />
  );
}
