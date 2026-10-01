import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { fetchIssuance, fetchReceivedOne } from "@/app/lib/applications";
import { fetchCatalogue } from "@/app/lib/field-catalog";
import { fetchCredentialCatalogue } from "@/app/lib/credential-catalog";
import { formatDateTime } from "@/app/lib/format";
import { label } from "@/app/lib/form-fields";
import { statusBadge } from "../status";
import { DecisionForm } from "./DecisionForm";
import { IssuanceForm } from "./IssuanceForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.applications.one };
}

const fact =
  "flex flex-wrap justify-between gap-x-3 gap-y-1 border-t pt-2.5 text-sm first:border-t-0 first:pt-0";

/**
 * One received application: whether the holder's signature holds over what
 * it says, every answer (those from a verified credential marked), the files
 * to download, the credentials presented, and the decision — to take, or
 * taken. Accepted, the credential to issue: its claims, proposed from the
 * application and settled here, then signed by the issuer's signer.
 */
export default async function ApplicationPage({
  params,
}: PageProps<"/dashboard/applications/[id]">) {
  const { id } = await params;
  const [{ t, locale }, item, credentials, timeZone] = await Promise.all([
    getI18n(),
    fetchReceivedOne(id),
    fetchCredentialCatalogue(),
    getTimeZone(),
  ]);
  if (!item) notFound();
  const [proposal, catalogue] =
    item.status === "accepted"
      ? await Promise.all([fetchIssuance(id), fetchCatalogue()])
      : [null, null];
  const copy = t.dashboard.applications;
  const types = new Map(
    credentials?.types.map((type) => [type.id, type.labels]),
  );
  const typeName = (type: string) =>
    types.get(type) ? label(types.get(type)!, locale) : type;

  return (
    <div className="grid gap-4">
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {copy.back}
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {typeName(item.content.credential_type)}
          </h1>
          <p className="text-muted-foreground">
            {item.issuer.name} · {label(item.form.name, locale)} ·{" "}
            <span className="font-mono text-[13px]">{item.slug}</span>
          </p>
        </div>
        <Badge variant={statusBadge[item.status]}>
          {copy.status[item.status]}
        </Badge>
      </header>

      <Card className="gap-3 p-5">
        <p className="flex items-center gap-2 font-semibold">
          {item.signature_valid ? (
            <ShieldCheckIcon className="size-5 text-primary" />
          ) : (
            <ShieldAlertIcon className="size-5 text-destructive" />
          )}
          {item.signature_valid ? copy.signed : copy.signatureBroken}
        </p>
        <dl className="grid gap-2.5">
          <div className={fact}>
            <dt className="text-muted-foreground">{copy.holder}</dt>
            <dd className="font-mono text-[12px] break-all">
              {item.holder_did}
            </dd>
          </div>
          <div className={fact}>
            <dt className="text-muted-foreground">{copy.submitted}</dt>
            <dd>{formatDateTime(item.submitted_at, locale, timeZone)}</dd>
          </div>
          <div className={fact}>
            <dt className="text-muted-foreground">{copy.digest}</dt>
            <dd className="font-mono text-[12px] break-all">{item.digest}</dd>
          </div>
        </dl>
      </Card>

      <Card className="gap-3 p-5">
        <h2 className="font-semibold">{copy.answers}</h2>
        <dl className="grid gap-2.5">
          {item.content.answers.map((answer) => (
            <div key={answer.key} className={fact}>
              <dt className="text-muted-foreground">
                {label(answer.label, locale)}
              </dt>
              <dd className="flex items-center gap-2 text-right">
                {answer.key in item.files ? (
                  <a
                    href={`/dashboard/applications/${item.id}/files/${answer.key}`}
                    className="text-primary hover:underline"
                  >
                    {label(answer.text, locale)}
                  </a>
                ) : (
                  label(answer.text, locale)
                )}
                {answer.verified && (
                  <Badge variant="brand">
                    <ShieldCheckIcon />
                    {copy.verified}
                  </Badge>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {item.content.credentials.length > 0 && (
        <Card className="gap-3 p-5">
          <h2 className="font-semibold">{copy.credentials}</h2>
          <ul className="grid gap-2.5">
            {item.content.credentials.map((credential) => (
              <li key={credential.key} className={fact}>
                <span>{typeName(credential.type)}</span>
                <span className="font-mono text-[12px] break-all text-muted-foreground">
                  {credential.issuer}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="gap-3 p-5">
        <h2 className="font-semibold">{copy.decision}</h2>
        {item.status === "submitted" ? (
          <DecisionForm id={item.id} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {copy.decided
              .replace("{status}", copy.status[item.status])
              .replace(
                "{when}",
                item.decided_at
                  ? formatDateTime(item.decided_at, locale, timeZone)
                  : "",
              )}
            {item.decision_note && (
              <span className="mt-2 block rounded-lg bg-sunk px-3.5 py-3 text-foreground">
                {item.decision_note}
              </span>
            )}
            {item.status === "issued" && item.issued_at && (
              <span className="mt-2 block">
                {copy.issued
                  .replace(
                    "{when}",
                    formatDateTime(item.issued_at, locale, timeZone),
                  )
                  .replace(
                    "{until}",
                    item.valid_until
                      ? formatDateTime(item.valid_until, locale, timeZone)
                      : "",
                  )}{" "}
                {item.delivered_at
                  ? copy.delivered.replace(
                      "{when}",
                      formatDateTime(item.delivered_at, locale, timeZone),
                    )
                  : copy.notDelivered}
              </span>
            )}
          </p>
        )}
      </Card>

      {item.status === "accepted" && (
        <Card className="gap-3 p-5">
          <h2 className="font-semibold">{copy.issuance}</h2>
          {!proposal || !catalogue ? (
            <p className="text-sm text-destructive">
              {copy.errors.unavailable}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {proposal.can_sign
                  ? copy.issuanceLead
                  : proposal.signer_needed
                    ? copy.signerNeeded
                    : copy.notTheSigner}
              </p>
              {proposal.can_sign && (
                <IssuanceForm
                  id={item.id}
                  proposal={proposal}
                  domains={Object.fromEntries(
                    Object.entries(catalogue.domains).map(([key, domain]) => [
                      key,
                      domain.codes,
                    ]),
                  )}
                />
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
