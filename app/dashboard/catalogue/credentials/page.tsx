import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchCredentialCatalogue } from "@/app/lib/credential-catalog";
import { fetchCatalogue } from "@/app/lib/field-catalog";
import { byId, label } from "@/app/lib/form-fields";
import { CatalogueTabs } from "../CatalogueTabs";
import { CredentialRow } from "./CredentialRow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.credentialsTab,
  };
}

/**
 * Almena's credential types, by category, read only: what issuers grant and
 * forms will ask to be presented. Each opens to its description, its claims
 * (fields of the catalogue, the required ones marked), how each format names
 * it and where its schema and type metadata are published.
 */
export default async function CredentialTypesPage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.catalogue;
  const [credentials, catalogue] = await Promise.all([
    fetchCredentialCatalogue(),
    fetchCatalogue(),
  ]);
  const fields = catalogue ? byId(catalogue) : null;

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.hint}</p>
      </header>
      <CatalogueTabs />

      {credentials === null || fields === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      ) : (
        <section className="grid gap-3" aria-labelledby="credentials">
          <div>
            <h2 id="credentials" className="text-lg font-semibold">
              {copy.credentials}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {copy.credentialsHint.replace("{version}", credentials.version)}
            </p>
          </div>
          {credentials.categories.map((category) => (
            <Card key={category.id} className="gap-0 py-0">
              <h3 className="border-b px-5 py-2.5 text-[13px] font-semibold text-muted-foreground">
                {label(category.labels, locale)}
              </h3>
              <ul>
                {credentials.types
                  .filter((item) => item.category === category.id)
                  .map((item) => (
                    <CredentialRow
                      key={item.id}
                      type={{
                        id: item.id,
                        label: label(item.labels, locale),
                        description: label(item.descriptions, locale),
                        source: item.source,
                        external: item.issuance === "external",
                        claims: item.claims.map((claim) => ({
                          label: fields.get(claim.field)
                            ? label(fields.get(claim.field)!.labels, locale)
                            : claim.field,
                          key: claim.field,
                          required: claim.required,
                        })),
                        identifiers: [
                          ["SD-JWT VC (vct)", item.formats["dc+sd-jwt"].vct],
                          ...(item.formats.jwt_vc_json
                            ? [
                                [
                                  "W3C VC (type)",
                                  item.formats.jwt_vc_json.type.join(", "),
                                ] as [string, string],
                              ]
                            : []),
                          ...(item.formats.mso_mdoc
                            ? [
                                [
                                  "mdoc (doctype)",
                                  item.formats.mso_mdoc.doctype,
                                ] as [string, string],
                              ]
                            : []),
                        ],
                        links: [item.schema, item.metadata].filter(
                          (link): link is string => Boolean(link),
                        ),
                      }}
                    />
                  ))}
              </ul>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
