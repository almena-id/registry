import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import {
  fetchCredentialCatalogue,
  fetchOwnCredentialTypes,
  type CredentialType,
} from "@/app/lib/credential-catalog";
import { deleteCredentialType } from "@/app/lib/credential-type-actions";
import { label } from "@/app/lib/form-fields";
import { formatCount } from "@/app/lib/plural";
import {
  CatalogueList,
  type CatalogueListRow,
} from "@/app/dashboard/(templates)/CatalogueList";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.nav.credentialTypes,
  };
}

/**
 * The credential types, as lists like the dashboard's others: the account's
 * own first (only its issuers grant them, only its forms ask for them), then
 * Almena's, which every account's issuers grant and forms ask for. Each row is
 * the type's name and key, what it states, a tag for those issued elsewhere
 * (the EU PID) and, on the right, its claims, category and formats; then its
 * actions — duplicate, open its type metadata, delete. Clicking a row the
 * account may change opens it. The trust anchor's own are Almena's.
 */
export default async function CredentialTypesPage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.catalogue;
  const [credentials, tenant, own] = await Promise.all([
    fetchCredentialCatalogue(),
    currentTenant(),
    fetchOwnCredentialTypes(),
  ]);
  const anchor = tenant?.anchor ?? false;
  const allowed =
    anchor || (tenant?.features.includes("own_credential_types") ?? false);

  const header = (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {t.dashboard.nav.credentialTypes}
          </h1>
          <p className="text-muted-foreground">{copy.typesHint}</p>
        </div>
        {allowed && (
          <Button asChild>
            <Link href="/dashboard/credential-types/new">
              <PlusIcon />
              {copy.createType}
            </Link>
          </Button>
        )}
      </header>
    </>
  );
  if (credentials === null || own === null)
    return (
      <div className="grid gap-8">
        {header}
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      </div>
    );

  const categories = new Map(
    credentials.categories.map((category, index) => [
      category.id,
      { index, name: label(category.labels, locale) },
    ]),
  );
  // The account's own by ref (the anchor's: Almena's), to change or delete.
  const owned = new Map(own.map((item) => [item.type.id, item.id]));
  const row = (item: CredentialType): CatalogueListRow => {
    const id = owned.get(item.id);
    const external = item.issuance === "external";
    return {
      id: id ?? item.id,
      href:
        id && allowed ? `/dashboard/credential-types/${id}/edit` : undefined,
      title: label(item.labels, locale),
      code: item.id,
      line: label(item.descriptions, locale),
      badges: external ? [{ text: copy.external, variant: "pending" }] : [],
      facts: [
        formatCount(copy.list.claims, item.claims.length, locale),
        categories.get(item.category)?.name ?? item.category,
        [
          "SD-JWT",
          ...(item.formats.jwt_vc_json ? ["W3C"] : []),
          ...(item.formats.mso_mdoc ? ["mdoc"] : []),
        ].join(" · "),
      ],
      // Another account copies what its issuers may grant: not those issued
      // elsewhere.
      duplicate:
        allowed && (anchor || !external)
          ? `/dashboard/credential-types/new?from=${encodeURIComponent(item.id)}`
          : undefined,
      schema: item.metadata ?? item.schema,
      removable: Boolean(id),
    };
  };
  const byCategory = (a: CredentialType, b: CredentialType) =>
    (categories.get(a.category)?.index ?? 99) -
    (categories.get(b.category)?.index ?? 99);
  const errors = copy.errors as Record<string, string>;

  return (
    <div className="grid gap-8">
      {header}
      {!anchor && (
        <section className="grid min-w-0 gap-3" aria-labelledby="your-types">
          <div>
            <h2 id="your-types" className="text-lg font-semibold">
              {copy.yourTypes}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {copy.yourTypesHint}
            </p>
          </div>
          <CatalogueList
            rows={[...own].reverse().map((item) => row(item.type))}
            remove={deleteCredentialType}
            errors={errors}
            empty={allowed ? copy.yourTypesEmpty : copy.subscribeForTypes}
          />
        </section>
      )}
      <section className="grid min-w-0 gap-3" aria-labelledby="credentials">
        <div>
          <h2 id="credentials" className="text-lg font-semibold">
            {copy.credentials}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {(anchor
              ? copy.credentialsAnchorHint
              : copy.credentialsHint
            ).replace("{version}", credentials.version)}
          </p>
        </div>
        <CatalogueList
          rows={[...credentials.types].sort(byCategory).map(row)}
          remove={anchor ? deleteCredentialType : undefined}
          errors={errors}
          empty={copy.list.empty}
        />
      </section>
    </div>
  );
}
