import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchCategories } from "@/app/lib/categories";
import { CategoryForm } from "../../CategoryForm";
import { kindOf } from "../../kinds";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.catalogue.categories.new };
}

/** A category of Almena's catalogue, of this kind: only the trust anchor adds them. */
export default async function NewCategoryPage({
  params,
  searchParams,
}: PageProps<"/dashboard/categories/[kind]/new">) {
  const [{ kind: segment }, { from }] = await Promise.all([
    params,
    searchParams,
  ]);
  const kind = kindOf(segment);
  const tenant = await currentTenant();
  if (!kind || !tenant?.anchor) notFound();
  const { t } = await getI18n();
  // A copy of another (`?from={id}`): its names, under a key of its own.
  const original =
    typeof from === "string"
      ? (await fetchCategories())?.find(
          (item) => item.id === from && item.kind === kind,
        )
      : undefined;
  const copy = t.dashboard.catalogue.categories;
  return (
    <div>
      <CreateHeader
        section={kind === "field" ? "fieldCategories" : "credentialCategories"}
        title={copy.new}
        lead={copy.newLeads[kind]}
      />
      <CategoryForm
        kind={kind}
        initial={
          original
            ? {
                kind,
                key: `${original.key}_copy`.slice(0, 32),
                labels: original.labels,
              }
            : { kind }
        }
      />
    </div>
  );
}
