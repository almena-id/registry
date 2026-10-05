import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { deleteCustomField } from "@/app/lib/custom-field-actions";
import { fetchCatalogue, fetchCustomFields } from "@/app/lib/field-catalog";
import {
  codesOf,
  label,
  type Catalogue,
  type CatalogueField,
} from "@/app/lib/form-fields";
import {
  CatalogueList,
  type CatalogueListRow,
} from "@/app/dashboard/(templates)/CatalogueList";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.nav.fields,
  };
}

/** Lists longer than this are summed up by their value list, not spelled out. */
const SPELLED = 6;

/**
 * The fields the account's forms are made of, as lists like the dashboard's
 * others: its own first, then Almena's. Each row is the field's name and key,
 * a line on what it holds (its standard, its parts, its values, its bounds)
 * and, on the right, its type and category; then its actions — duplicate,
 * open its published schema, delete. Clicking a row the account may change
 * opens it. The trust anchor's own are Almena's.
 */
export default async function CataloguePage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.catalogue;
  const [catalogue, custom, tenant] = await Promise.all([
    fetchCatalogue(),
    fetchCustomFields(),
    currentTenant(),
  ]);
  const anchor = tenant?.anchor ?? false;
  // Making and changing fields of its own takes a subscription (the anchor
  // always may); deleting them does not.
  const allowed = anchor || (tenant?.features.includes("own_fields") ?? false);

  if (catalogue === null || custom === null)
    return (
      <Shell allowed={allowed}>
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      </Shell>
    );

  const categories = new Map(
    catalogue.categories.map((category, index) => [category.id, index]),
  );
  // What a field holds, in a line.
  const holds = (item: CatalogueField): string => {
    const said: string[] = [];
    if (item.parts)
      said.push(
        copy.list.parts.replace(
          "{value}",
          item.parts.map((part) => label(part.field.labels, locale)).join(", "),
        ),
      );
    if (item.codes || item.domain) {
      const codes = codesOf(catalogue as Catalogue, item);
      const domain = item.domain ? catalogue.domains[item.domain] : undefined;
      said.push(
        domain && (codes.length > SPELLED || !item.values)
          ? copy.list.valueList
              .replace("{name}", label(domain.labels, locale))
              .replace("{count}", String(codes.length))
          : copy.values.replace(
              "{value}",
              codes.map((code) => label(code.labels, locale)).join(", "),
            ),
      );
    }
    if (item.max_length)
      said.push(
        t.dashboard.forms.restrictions.max_length.replace(
          "{value}",
          String(item.max_length),
        ),
      );
    if (item.pattern) said.push(copy.matches.replace("{value}", item.pattern));
    return said.join(" · ");
  };
  const row = (
    item: CatalogueField,
    own: { id: string; ref: string } | undefined,
  ): CatalogueListRow => ({
    id: own?.id ?? item.id,
    href: own && allowed ? `/dashboard/fields/${own.id}/edit` : undefined,
    title: label(item.labels, locale),
    code: item.id,
    line: [own && !anchor ? "" : item.source, holds(item)]
      .filter(Boolean)
      .join(" · "),
    facts: [
      t.dashboard.forms.types[item.type],
      ...(item.category && item.category !== "custom"
        ? [
            label(
              catalogue.categories.find((c) => c.id === item.category)
                ?.labels ?? {},
              locale,
            ) || item.category,
          ]
        : []),
    ],
    // Groups are the trust anchor's: another account copies plain fields.
    duplicate:
      allowed && (anchor || item.type !== "group")
        ? `/dashboard/fields/new?from=${encodeURIComponent(item.id)}`
        : undefined,
    schema: item.schema,
    removable: Boolean(own),
  });
  // The anchor's fields by key: Almena's, its own.
  const owned = new Map(custom.map((item) => [item.ref, item.id]));
  const almena = [...catalogue.fields]
    .sort(
      (a, b) =>
        (categories.get(a.category ?? "") ?? 99) -
        (categories.get(b.category ?? "") ?? 99),
    )
    .map((item) =>
      row(
        item,
        anchor && owned.has(item.id)
          ? { id: owned.get(item.id)!, ref: item.id }
          : undefined,
      ),
    );
  const errors = copy.errors as Record<string, string>;

  return (
    <Shell allowed={allowed}>
      {!anchor && (
        <section className="grid min-w-0 gap-3" aria-labelledby="yours">
          <div>
            <h2 id="yours" className="text-lg font-semibold">
              {copy.yours}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {copy.yoursHint}
            </p>
          </div>
          <CatalogueList
            rows={custom.map((item) => row(item.field, item))}
            remove={deleteCustomField}
            errors={errors}
            empty={allowed ? copy.yoursEmpty : copy.subscribeForFields}
          />
        </section>
      )}
      <section className="grid min-w-0 gap-3" aria-labelledby="almena">
        <div>
          <h2 id="almena" className="text-lg font-semibold">
            {copy.almena}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {(anchor ? copy.anchorHint : copy.almenaHint).replace(
              "{version}",
              catalogue.version,
            )}
          </p>
        </div>
        <CatalogueList
          rows={almena}
          remove={anchor ? deleteCustomField : undefined}
          errors={errors}
          empty={copy.list.empty}
        />
      </section>
    </Shell>
  );
}

/** The page around the lists: its title and "Create field". */
async function Shell({
  allowed,
  children,
}: {
  allowed: boolean;
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  const copy = t.dashboard.catalogue;
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {t.dashboard.nav.fields}
          </h1>
          <p className="text-muted-foreground">{copy.hint}</p>
        </div>
        {allowed && (
          <Button asChild>
            <Link href="/dashboard/fields/new">
              <PlusIcon />
              {copy.create}
            </Link>
          </Button>
        )}
      </header>
      {children}
    </div>
  );
}
