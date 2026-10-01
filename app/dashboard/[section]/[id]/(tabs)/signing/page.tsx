import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { personLabel } from "@/app/lib/person";
import { fetchSigning } from "@/app/lib/directory";
import { fetchMembers } from "@/app/lib/members";
import { loadItem } from "../../load";
import { SigningForm } from "./SigningForm";

/** One fact: its name on the left, its value on the right. */
const FACT =
  "flex flex-wrap justify-between gap-2 border-t pt-3 text-sm first:border-t-0 first:pt-0";

/**
 * Signing: how an issuer or verifier signs — nobody signs on the server,
 * people do from their wallets. Admins set the system and, for one specific
 * user, who; other members read it. Mediators sign nothing: no such tab.
 */
export default async function SigningTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/signing">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (
    !loaded ||
    (loaded.section !== "issuers" && loaded.section !== "verifiers")
  )
    notFound();
  if (!loaded.item) return null;
  const { t } = await getI18n();
  const copy = t.dashboard.signing;
  const [signing, members, tenant] = await Promise.all([
    fetchSigning(loaded.section, id),
    fetchMembers(),
    currentTenant(),
  ]);
  if (!signing)
    return (
      <Card className="min-w-0 gap-0 p-5">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      </Card>
    );

  const signer = signing.signer;
  const signerLabel = signer
    ? `${personLabel(signer, t.dashboard.users.noEmail)}${
        signer.member ? "" : ` (${copy.leftTenant})`
      }`
    : null;
  // Without a wallet there is no key for the DID document: what they sign cannot be checked.
  const noWallet =
    signing.system === "single_user" && signer?.member && !signer.wallet ? (
      <Alert variant="notice" role="status" className="mb-3">
        <AlertDescription>{copy.noWallet}</AlertDescription>
      </Alert>
    ) : null;

  if (tenant?.role !== "admin")
    return (
      <>
        {noWallet}
        <Card className="min-w-0 gap-0 p-5">
          <dl className="grid gap-3">
            <div className={FACT}>
              <dt className="text-muted-foreground">{copy.system}</dt>
              {signing.system ? (
                <dd>{copy[signing.system]}</dd>
              ) : (
                <dd className="text-faint">{copy.notConfigured}</dd>
              )}
            </div>
            {signing.system === "single_user" && (
              <div className={FACT}>
                <dt className="text-muted-foreground">{copy.signer}</dt>
                <dd>{signerLabel}</dd>
              </div>
            )}
          </dl>
        </Card>
      </>
    );

  const choices = (members ?? [])
    .filter((member) => member.status === "member" && member.user_id)
    .map((member) => ({
      id: member.user_id!,
      label: personLabel(member, t.dashboard.users.noEmail),
    }));
  // A signer who left stays visible until somebody else is chosen.
  if (signer && !choices.some((choice) => choice.id === signer.id))
    choices.push({ id: signer.id, label: signerLabel! });

  return (
    <>
      {noWallet}
      <SigningForm
        section={loaded.section}
        id={id}
        system={signing.system ?? ""}
        signer={signer?.id ?? ""}
        members={choices}
      />
    </>
  );
}
