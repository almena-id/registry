import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchCategories } from "@/app/lib/categories";
import { label } from "@/app/lib/form-fields";
import { CategoryForm } from "../../../CategoryForm";
import { kindOf } from "../../../kinds";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.catalogue.categories.edit };
}

/** Rename a category of Almena's catalogue: only the trust anchor does. */
export default async function EditCategoryPage({
  params,
}: PageProps<"/dashboard/categories/[kind]/[id]/edit">) {
  const { kind: segment, id } = await params;
  const kind = kindOf(segment);
  const tenant = await currentTenant();
  if (!kind || !tenant?.anchor) notFound();
  const [{ t, locale }, categories] = await Promise.all([
    getI18n(),
    fetchCategories(),
  ]);
  const item = categories?.find(
    (entry) => entry.id === id && entry.kind === kind,
  );
  if (!item) notFound();
  const copy = t.dashboard.catalogue.categories;
  return (
    <div>
      <CreateHeader
        section={kind === "field" ? "fieldCategories" : "credentialCategories"}
        title={copy.edit}
        lead={copy.editLead.replace("{label}", label(item.labels, locale))}
      />
      <CategoryForm
        kind={kind}
        edit={item.id}
        initial={{ kind: item.kind, key: item.key, labels: item.labels }}
      />
    </div>
  );
}
