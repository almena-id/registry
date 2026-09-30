import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchMembers } from "@/app/lib/members";
import { personLabel } from "@/app/lib/person";
import { fetchTenant } from "@/app/lib/tenant";
import { SigningFlowForm } from "./SigningFlowForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.detail.signing,
  };
}

/**
 * Signing: who signs as the tenant — its identities' did:webvh log entries and
 * its endorsements of what it publishes. Nothing the tenant publishes counts
 * without those signatures, whatever is changed on the server, so the flow is
 * the account's real safeguard and gets a menu entry of its own.
 *
 * Configuration on the left (the flow, and what that flow asks for); on the
 * right, every flow the registry offers, drawn side by side so the choice is
 * made by comparing them. Admins change it; members read it.
 */
export default async function SigningPage() {
  const { t } = await getI18n();
  const [tenant, members] = await Promise.all([fetchTenant(), fetchMembers()]);
  if (!tenant)
    return (
      <Card className="gap-0 px-5 py-10 text-center">
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t.dashboard.tenant.errors.unavailable}
          </AlertDescription>
        </Alert>
      </Card>
    );

  const noEmail = t.dashboard.users.noEmail;
  const signer = tenant.signer;
  const choices = (members ?? [])
    .filter((member) => member.status === "member" && member.user_id)
    .map((member) => ({
      id: member.user_id!,
      label: personLabel(member, noEmail),
    }));
  // A signer who left stays visible until somebody else is chosen.
  if (signer && !choices.some((choice) => choice.id === signer.id))
    choices.push({
      id: signer.id,
      label: `${personLabel(signer, noEmail)} (${t.dashboard.signing.leftTenant})`,
    });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {t.dashboard.detail.signing}
        </h1>
        <p className="text-muted-foreground">
          {t.dashboard.tenant.signingLead}
        </p>
      </header>
      <SigningFlowForm
        signingFlow={tenant.signing_flow}
        signer={signer?.id ?? ""}
        // Without a wallet there is no key: nothing they sign can be checked.
        signerWithoutWallet={Boolean(signer?.member && !signer.wallet)}
        members={choices}
        editable={tenant.role === "admin"}
      />
    </div>
  );
}
