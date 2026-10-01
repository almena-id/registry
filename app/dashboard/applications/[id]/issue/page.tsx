import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeftIcon } from "lucide-react";

import { WalletRequest } from "@/app/components/WalletRequest";
import { Card } from "@/app/components/ui/card";
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
    <div className="grid gap-4">
      <Link
        href={back}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {copy.one}
      </Link>
      <header className="mb-2">
        <h1 className="text-[28px] font-bold tracking-tight">
          {copy.signTitle}
        </h1>
        <p className="text-muted-foreground">{copy.signLead}</p>
      </header>
      <Card className="max-w-[400px] gap-0 p-6">
        <WalletRequest
          purpose="sign"
          target={{ kind: "credential", id, back }}
        />
      </Card>
    </div>
  );
}
