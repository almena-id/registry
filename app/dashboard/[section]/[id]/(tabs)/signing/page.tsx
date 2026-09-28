import { notFound } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { currentTenants } from "@/app/lib/api";
import { fetchSigning } from "@/app/lib/directory";
import { fetchMembers } from "@/app/lib/members";
import { loadItem } from "../../load";
import { SigningForm } from "./SigningForm";

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
  const [signing, members, tenants] = await Promise.all([
    fetchSigning(loaded.section, id),
    fetchMembers(),
    currentTenants(),
  ]);
  if (!signing)
    return (
      <div className="card identity__card">
        <p className="alert" role="alert">
          {copy.errors.unavailable}
        </p>
      </div>
    );

  const signer = signing.signer;
  const signerLabel = signer
    ? `${signer.alias ?? signer.email}${signer.alias ? ` · ${signer.email}` : ""}${
        signer.member ? "" : ` (${copy.leftTenant})`
      }`
    : null;

  if (tenants[0]?.role !== "admin")
    return (
      <div className="card identity__card">
        <dl className="facts">
          <div>
            <dt>{copy.system}</dt>
            {signing.system ? (
              <dd>{copy[signing.system]}</dd>
            ) : (
              <dd className="facts__empty">{copy.notConfigured}</dd>
            )}
          </div>
          {signing.system === "single_user" && (
            <div>
              <dt>{copy.signer}</dt>
              <dd>{signerLabel}</dd>
            </div>
          )}
        </dl>
      </div>
    );

  const choices = (members ?? [])
    .filter((member) => member.status === "member" && member.user_id)
    .map((member) => ({
      id: member.user_id!,
      label: member.alias ? `${member.alias} · ${member.email}` : member.email,
    }));
  // A signer who left stays visible until somebody else is chosen.
  if (signer && !choices.some((choice) => choice.id === signer.id))
    choices.push({ id: signer.id, label: signerLabel! });

  return (
    <SigningForm
      section={loaded.section}
      id={id}
      system={signing.system ?? ""}
      signer={signer?.id ?? ""}
      members={choices}
    />
  );
}
