import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchCatalogue, fetchCustomFields } from "@/app/lib/field-catalog";
import { label } from "@/app/lib/form-fields";
import { draftOfOwn } from "@/app/dashboard/(templates)/field-draft";
import { CustomFieldForm } from "../../new/CustomFieldForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.editField,
  };
}

/**
 * Change one of the account's fields — the trust anchor's: one of Almena's —
 * its key fixed. While something uses it, the API takes only changes that turn
 * away nothing it took.
 */
export default async function EditFieldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ t, locale }, catalogue, custom, tenant] = await Promise.all([
    getI18n(),
    fetchCatalogue(),
    fetchCustomFields(),
    currentTenant(),
  ]);
  const copy = t.dashboard.catalogue;
  if (catalogue && custom) {
    const item = custom.find((entry) => entry.id === id);
    if (!item) notFound();
    const anchor = tenant?.anchor ?? false;
    if (!anchor && !tenant?.features.includes("own_fields")) notFound();
    const { field } = item;
    return (
      <div>
        <CreateHeader
          section="fields"
          title={copy.editField}
          lead={copy.editLead.replace("{label}", label(field.labels, locale))}
        />
        <CustomFieldForm
          lists={Object.entries(catalogue.domains)
            .filter(([key]) => key !== "file_format")
            .map(([key, list]) => ({
              value: key,
              label: label(list.labels, locale),
            }))}
          formats={catalogue.domains.file_format.codes.map((code) => ({
            value: String(code.value),
            label: code.labels[locale] ?? code.labels.en,
          }))}
          categories={
            anchor
              ? catalogue.categories.map((category) => ({
                  value: category.id,
                  label: label(category.labels, locale),
                }))
              : undefined
          }
          edit={{ id: item.id, initial: draftOfOwn(item, catalogue, anchor) }}
        />
      </div>
    );
  }
  return (
    <div>
      <CreateHeader section="fields" title={copy.editField} lead="" />
      <Alert variant="destructive" role="alert">
        <AlertDescription>{copy.errors.unavailable}</AlertDescription>
      </Alert>
    </div>
  );
}
