import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchCatalogue, fetchCustomFields } from "@/app/lib/field-catalog";
import {
  codesOf,
  label,
  type Catalogue,
  type CatalogueField,
} from "@/app/lib/form-fields";
import { CatalogueRow, type CatalogueEntry } from "./CatalogueRow";
import { CatalogueTabs } from "./CatalogueTabs";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.title,
  };
}

/** Lists longer than this are summed up by their domain, not spelled out. */
const SPELLED = 12;

/**
 * The catalogue of fields the account's forms are made of: its own fields
 * first ("Create field" adds one), then Almena's — standard, the same for
 * every account, read only — by category, each with its standard, its parts,
 * its values and where its JSON Schema is published.
 */
export default async function CataloguePage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.catalogue;
  const [catalogue, custom] = await Promise.all([
    fetchCatalogue(),
    fetchCustomFields(),
  ]);

  const entry = (
    item: CatalogueField,
    key: string,
    customId?: string,
  ): CatalogueEntry => {
    const details: string[] = [];
    if (!customId)
      details.push(t.dashboard.forms.source.replace("{source}", item.source));
    if (item.parts)
      details.push(
        `${t.dashboard.forms.includes} ${item.parts
          .map((part) => label(part.field.labels, locale))
          .join(", ")}`,
      );
    if (catalogue && (item.codes || item.domain)) {
      const codes = codesOf(catalogue as Catalogue, item);
      const domain = item.domain ? catalogue.domains[item.domain] : undefined;
      details.push(
        codes.length > SPELLED && domain
          ? copy.domain
              .replace("{domain}", label(domain.labels, locale))
              .replace("{source}", domain.source)
              .replace("{count}", String(codes.length))
          : copy.values.replace(
              "{value}",
              codes.map((code) => label(code.labels, locale)).join(", "),
            ),
      );
    }
    if (item.max_length)
      details.push(
        t.dashboard.forms.restrictions.max_length.replace(
          "{value}",
          String(item.max_length),
        ),
      );
    if (item.pattern)
      details.push(copy.matches.replace("{value}", item.pattern));
    return {
      key,
      label: label(item.labels, locale),
      type: t.dashboard.forms.types[item.type],
      details,
      schema: item.schema,
      customId,
    };
  };

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.hint}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/catalogue/new">
            <PlusIcon />
            {copy.create}
          </Link>
        </Button>
      </header>
      <CatalogueTabs />

      {catalogue === null || custom === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      ) : (
        <>
          <section className="grid gap-3" aria-labelledby="yours">
            <div>
              <h2 id="yours" className="text-lg font-semibold">
                {copy.yours}
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {copy.yoursHint}
              </p>
            </div>
            <Card className="gap-0 py-0">
              {custom.length === 0 ? (
                <p className="px-5 py-8 text-center text-faint">
                  {copy.yoursEmpty}
                </p>
              ) : (
                <ul>
                  {custom.map((item) => (
                    <CatalogueRow
                      key={item.id}
                      entry={entry(item.field, item.key, item.id)}
                    />
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section className="grid gap-3" aria-labelledby="almena">
            <div>
              <h2 id="almena" className="text-lg font-semibold">
                {copy.almena}
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {copy.almenaHint.replace("{version}", catalogue.version)}
              </p>
            </div>
            {catalogue.categories.map((category) => (
              <Card key={category.id} className="gap-0 py-0">
                <h3 className="border-b px-5 py-2.5 text-[13px] font-semibold text-muted-foreground">
                  {label(category.labels, locale)}
                </h3>
                <ul>
                  {catalogue.fields
                    .filter((item) => item.category === category.id)
                    .map((item) => (
                      <CatalogueRow
                        key={item.id}
                        entry={entry(item, item.id)}
                      />
                    ))}
                </ul>
              </Card>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
