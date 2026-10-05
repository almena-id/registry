import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { CatalogueList } from "@/app/dashboard/(templates)/CatalogueList";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { deleteCategory } from "@/app/lib/category-actions";
import { fetchCategories } from "@/app/lib/categories";
import { label } from "@/app/lib/form-fields";
import { formatCount } from "@/app/lib/plural";
import { kindOf } from "../kinds";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/categories/[kind]">): Promise<Metadata> {
  const { kind } = await params;
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.categories.kinds[kindOf(kind) ?? "field"],
  };
}

/**
 * The trust anchor's categories of one kind — fields or credential types — as
 * a list like the dashboard's others: each row its name and key, its name in
 * the other languages and, on the right, how much is filed under it; then its
 * actions — duplicate, delete (while nothing is filed under it). Clicking a
 * row opens it.
 */
export default async function CategoriesPage({
  params,
}: PageProps<"/dashboard/categories/[kind]">) {
  const { kind: segment } = await params;
  const kind = kindOf(segment);
  const tenant = await currentTenant();
  if (!kind || !tenant?.anchor) notFound();
  const [{ t, locale }, categories] = await Promise.all([
    getI18n(),
    fetchCategories(),
  ]);
  const copy = t.dashboard.catalogue;
  const words = copy.categories;
  const base = `/dashboard/categories/${segment}`;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {words.kinds[kind]}
          </h1>
          <p className="text-muted-foreground">{words.hints[kind]}</p>
        </div>
        <Button asChild>
          <Link href={`${base}/new`}>
            <PlusIcon />
            {words.create}
          </Link>
        </Button>
      </header>

      {categories === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{words.errors.unavailable}</AlertDescription>
        </Alert>
      ) : (
        <CatalogueList
          rows={categories
            .filter((item) => item.kind === kind)
            .map((item) => ({
              id: item.id,
              href: `${base}/${item.id}/edit`,
              title: label(item.labels, locale),
              code: item.key,
              // Its name in the other languages, at a glance.
              line: Object.entries(item.labels)
                .filter(([lang]) => lang !== locale)
                .map(([, name]) => name)
                .join(" · "),
              facts: [formatCount(words.uses, item.uses, locale)],
              duplicate: `${base}/new?from=${item.id}`,
              removable: true,
              blocked: item.uses > 0 ? words.errors.inUse : undefined,
            }))}
          remove={deleteCategory}
          errors={words.errors as Record<string, string>}
          empty={copy.list.empty}
        />
      )}
    </div>
  );
}
