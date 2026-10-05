import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeftIcon } from "lucide-react";

import { WalletRequest } from "@/app/components/WalletRequest";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchReceivedOne } from "@/app/lib/applications";
import {
  fetchStatusLists,
  type CredentialStatus,
} from "@/app/lib/status-lists";

export async function generateMetadata({
  searchParams,
}: PageProps<"/dashboard/applications/[id]/status">): Promise<Metadata> {
  const { to } = await searchParams;
  const { t } = await getI18n();
  const titles = t.dashboard.applications.changeTitle;
  return {
    title:
      titles[
        (to as CredentialStatus) in titles
          ? (to as CredentialStatus)
          : "suspended"
      ],
  };
}

/**
 * Giving an issued credential a new status (`to`): suspended, valid again, or
 * revoked for good. The issuer's signer's wallet signs the issuer's status
 * list with that entry changed — showing the change first — and only then
 * does it hold. Only for that signer, and only a change its status allows.
 */
export default async function CredentialStatusPage({
  params,
  searchParams,
}: PageProps<"/dashboard/applications/[id]/status">) {
  const { id } = await params;
  const { to } = await searchParams;
  const back = `/dashboard/applications/${id}`;
  const [{ t }, item] = await Promise.all([getI18n(), fetchReceivedOne(id)]);
  if (!item) notFound();
  const wanted = item.credential_statuses.find((status) => status === to);
  if (!wanted) redirect(back);
  if (!(await fetchStatusLists(item.issuer.id))?.can_sign) redirect(back);
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
          {copy.changeTitle[wanted]}
        </h1>
        {wanted !== "revoked" && (
          <p className="text-muted-foreground">{copy.changeLead[wanted]}</p>
        )}
      </header>
      {wanted === "revoked" && (
        <Alert variant="destructive" className="max-w-[640px]">
          <AlertDescription>{copy.changeLead.revoked}</AlertDescription>
        </Alert>
      )}
      <Card className="max-w-[400px] gap-0 p-6">
        <WalletRequest
          purpose="sign"
          target={{ kind: "credential_status", id, status: wanted, back }}
        />
      </Card>
    </div>
  );
}
