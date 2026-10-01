import type { Metadata } from "next";
import Link from "next/link";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import { fetchApplication } from "@/app/lib/applications";
import { fetchCredentialCatalogue } from "@/app/lib/credential-catalog";
import { fetchCatalogue } from "@/app/lib/field-catalog";
import { label } from "@/app/lib/form-fields";
import { Apply } from "./Apply";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.apply.title };
}

/**
 * An application this browser started (its secret is in a cookie): who it
 * goes to and for what, then its steps (`Apply`). Anyone else, or after a
 * day unsubmitted, finds it gone.
 */
export default async function ApplyPage({ params }: PageProps<"/apply/[id]">) {
  const { id } = await params;
  const [{ t, locale }, application, catalogue, credentials] =
    await Promise.all([
      getI18n(),
      fetchApplication(id),
      fetchCatalogue(),
      fetchCredentialCatalogue(),
    ]);
  const copy = t.apply;

  if (!application || !catalogue || !credentials)
    return (
      <div className="mx-auto grid w-full max-w-[640px] gap-4">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.gone}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="justify-self-start">
          <Link href="/credentials">{copy.toCatalogue}</Link>
        </Button>
      </div>
    );

  const { offer } = application;
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
          {(offer.form.description && label(offer.form.description, locale)) ||
            label(offer.credential_type.descriptions, locale)}
        </p>
      </header>
      <Apply
        application={application}
        domains={Object.fromEntries(
          Object.entries(catalogue.domains).map(([key, domain]) => [
            key,
            domain.codes,
          ]),
        )}
        types={Object.fromEntries(
          credentials.types.map((type) => [type.id, type.labels]),
        )}
      />
    </div>
  );
}
