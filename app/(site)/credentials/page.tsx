import type { Metadata } from "next";
import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import {
  fetchCredentialCatalogue,
  fetchPublishedIssuers,
} from "@/app/lib/credential-catalog";
import { label } from "@/app/lib/form-fields";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.apply.catalogueTitle };
}

/**
 * Public: the credentials holders can apply for — every published issuer's
 * offers (a type it grants, with a form) — each opening its offer.
 */
export default async function CredentialsPage() {
  const [{ t, locale }, issuers, credentials] = await Promise.all([
    getI18n(),
    fetchPublishedIssuers(),
    fetchCredentialCatalogue(),
  ]);
  const copy = t.apply;
  const offers = (issuers ?? []).flatMap((issuer) =>
    (issuer.offers ?? []).map((type) => ({ issuer, type })),
  );
  const types = new Map(credentials?.types.map((type) => [type.id, type]));

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight">
          {copy.catalogueTitle}
        </h1>
        <p className="text-muted-foreground">{copy.catalogueLead}</p>
      </header>
      {issuers === null || credentials === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      ) : offers.length === 0 ? (
        <p className="rounded-xl border border-dashed px-5 py-10 text-center text-faint">
          {copy.catalogueEmpty}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {offers.map(({ issuer, type }) => {
            const kind = types.get(type);
            return (
              <li key={`${issuer.slug}-${type}`}>
                <Link
                  href={`/credentials/${issuer.slug}/${type}`}
                  className="block h-full rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Card className="h-full gap-2 p-5 transition-colors hover:bg-accent">
                    <Badge variant="muted" className="justify-self-start">
                      {kind &&
                      credentials.categories.find((c) => c.id === kind.category)
                        ? label(
                            credentials.categories.find(
                              (c) => c.id === kind.category,
                            )!.labels,
                            locale,
                          )
                        : type}
                    </Badge>
                    <span className="text-lg font-semibold">
                      {kind ? label(kind.labels, locale) : type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {copy.by.replace("{issuer}", issuer.name)}
                    </span>
                    {kind && (
                      <span className="text-[13px] text-faint">
                        {label(kind.descriptions, locale)}
                      </span>
                    )}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
