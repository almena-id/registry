import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { label } from "@/app/lib/form-fields";
import { formatCount } from "@/app/lib/plural";
import { deleteDomain } from "@/app/lib/value-domain-actions";
import { fetchValueDomains } from "@/app/lib/value-domains";
import { CatalogueList } from "@/app/dashboard/(templates)/CatalogueList";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.catalogue.domains.title };
}

/** Codes shown in a row's line before the rest are summed up. */
const SHOWN = 4;

/**
 * The trust anchor's value lists, as a list like the dashboard's others: each
 * row its name and key, where it comes from and its first codes, and on the
 * right how many codes it has and how many fields draw on it; then its
 * actions — duplicate, delete (not while a field draws on it, nor the file
 * formats). Clicking a row opens it.
 */
export default async function DomainsPage() {
  const tenant = await currentTenant();
  if (!tenant?.anchor) notFound();
  const [{ t, locale }, domains] = await Promise.all([
    getI18n(),
    fetchValueDomains(),
  ]);
  const copy = t.dashboard.catalogue;
  const words = copy.domains;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {words.title}
          </h1>
          <p className="text-muted-foreground">{words.hint}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/value-lists/new">
            <PlusIcon />
            {words.create}
          </Link>
        </Button>
      </header>

      {domains === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{words.errors.unavailable}</AlertDescription>
        </Alert>
      ) : (
        <CatalogueList
          rows={domains.map((item) => {
            const first = item.codes
              .slice(0, SHOWN)
              .map((code) => label(code.labels, locale))
              .join(", ");
            return {
              id: item.id,
              href: `/dashboard/value-lists/${item.id}/edit`,
              title: label(item.labels, locale),
              code: item.key,
              line: [
                item.source,
                item.codes.length > SHOWN ? `${first}…` : first,
              ].join(" · "),
              facts: [
                formatCount(words.codeCount, item.codes.length, locale),
                formatCount(words.uses, item.uses, locale),
              ],
              duplicate: `/dashboard/value-lists/new?from=${item.id}`,
              removable: true,
              blocked:
                item.key === "file_format"
                  ? copy.list.fileFormats
                  : item.uses > 0
                    ? copy.list.inUse
                    : undefined,
            };
          })}
          remove={deleteDomain}
          errors={words.errors as Record<string, string>}
          empty={copy.list.empty}
        />
      )}
    </div>
  );
}
