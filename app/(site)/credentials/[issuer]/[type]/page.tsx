import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchOffer } from "@/app/lib/applications";
import { fetchCredentialCatalogue } from "@/app/lib/credential-catalog";
import { label } from "@/app/lib/form-fields";
import { StartForm } from "./StartForm";

export async function generateMetadata({
  params,
}: PageProps<"/credentials/[issuer]/[type]">): Promise<Metadata> {
  const { issuer, type } = await params;
  const [offer, { locale }] = await Promise.all([
    fetchOffer(issuer, type),
    getI18n(),
  ]);
  return offer ? { title: label(offer.credential_type.labels, locale) } : {};
}

/**
 * Public: one offer — who grants the credential, what it says, what the
 * issuer will ask for (the fields, the credentials to present) and how
 * applying goes, then "Start".
 */
export default async function OfferPage({
  params,
}: PageProps<"/credentials/[issuer]/[type]">) {
  const { issuer, type } = await params;
  const [offer, credentials, { t, locale }] = await Promise.all([
    fetchOffer(issuer, type),
    fetchCredentialCatalogue(),
    getI18n(),
  ]);
  if (!offer) notFound();
  const copy = t.apply;
  const types = new Map(credentials?.types.map((item) => [item.id, item]));

  return (
    <div className="mx-auto grid w-full max-w-[720px] gap-6">
      <header>
        <p className="text-[13px] font-semibold text-muted-foreground">
          {offer.issuer.name}
        </p>
        <h1 className="text-[28px] font-bold tracking-tight">
          {label(offer.credential_type.labels, locale)}
        </h1>
        <p className="text-muted-foreground">
          {label(offer.credential_type.descriptions, locale)}
        </p>
        <p className="mt-1 font-mono text-[11px] break-all text-faint">
          {offer.issuer.did}
        </p>
      </header>

      <Card className="gap-4 p-6">
        <h2 className="text-lg font-semibold">{copy.asksTitle}</h2>
        {offer.form.description && (
          <p className="text-sm text-muted-foreground">
            {label(offer.form.description, locale)}
          </p>
        )}
        <ul className="grid gap-1.5 text-sm">
          {offer.form.fields.map((field) => (
            <li key={field.key}>
              {label(field.field.labels, locale)}
              {!field.required && (
                <span className="text-muted-foreground">
                  {" "}
                  · {copy.optional}
                </span>
              )}
            </li>
          ))}
        </ul>
        {offer.form.credentials.length > 0 && (
          <>
            <h3 className="font-semibold">{copy.credentialsTitle}</h3>
            <ul className="grid gap-1.5 text-sm">
              {offer.form.credentials.map((request) => (
                <li key={request.key}>
                  {types.get(request.type)
                    ? label(types.get(request.type)!.labels, locale)
                    : request.type}
                  {!request.required && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {copy.optional}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card className="gap-3 p-6">
        <h2 className="text-lg font-semibold">{copy.howTitle}</h2>
        <ol className="grid list-decimal gap-1.5 pl-5 text-sm text-muted-foreground">
          <li>{copy.howPair}</li>
          <li>{copy.howFill}</li>
          <li>{copy.howSubmit.replace("{issuer}", offer.issuer.name)}</li>
        </ol>
        <StartForm issuer={offer.issuer.slug} type={offer.credential_type.id} />
      </Card>
    </div>
  );
}
