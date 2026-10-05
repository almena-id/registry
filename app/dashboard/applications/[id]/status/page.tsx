import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { WalletScreen } from "@/app/dashboard/WalletScreen";
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

  // Revoking is final: said as a warning over the card, not as the lead.
  const revoked = wanted === "revoked";
  return (
    <WalletScreen
      back={back}
      backLabel={copy.one}
      title={copy.changeTitle[wanted]}
      lead={revoked ? undefined : copy.changeLead[wanted]}
      notice={
        revoked && (
          <Alert variant="destructive">
            <AlertDescription>{copy.changeLead.revoked}</AlertDescription>
          </Alert>
        )
      }
      purpose="sign"
      target={{ kind: "credential_status", id, status: wanted, back }}
    />
  );
}
