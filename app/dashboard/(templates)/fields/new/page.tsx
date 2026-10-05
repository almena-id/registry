import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import type { CustomFieldState } from "@/app/lib/custom-field-actions";
import { fetchCatalogue, fetchCustomFields } from "@/app/lib/field-catalog";
import { label } from "@/app/lib/form-fields";
import {
  copyKey,
  draftOfOwn,
  draftOfPublished,
} from "@/app/dashboard/(templates)/field-draft";
import { CustomFieldForm } from "./CustomFieldForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.new,
  };
}

/**
 * A field of the account's own, for what Almena's catalogue lacks; the trust
 * anchor's, a field of Almena's catalogue, for every account.
 */
export default async function NewCustomFieldPage({
  searchParams,
}: PageProps<"/dashboard/fields/new">) {
  const { from } = await searchParams;
  const [{ t, locale }, catalogue, custom, tenant] = await Promise.all([
    getI18n(),
    fetchCatalogue(),
    fetchCustomFields(),
    currentTenant(),
  ]);
  const copy = t.dashboard.catalogue;
  const anchor = tenant?.anchor ?? false;
  // Fields of one's own come with a subscription; the anchor always may.
  if (!anchor && !tenant?.features.includes("own_fields")) notFound();
  // A copy of another field (`?from={ref}`): the account's own, or — for
  // another account — one of Almena's plain fields.
  let start: CustomFieldState | undefined;
  if (typeof from === "string" && catalogue) {
    const own = custom?.find((item) => item.ref === from);
    const published = catalogue.fields.find((item) => item.id === from);
    const draft = own
      ? draftOfOwn(own, catalogue, anchor)
      : published && (anchor || published.type !== "group")
        ? draftOfPublished(published, catalogue)
        : undefined;
    if (draft) start = { ...draft, key: copyKey(draft.key ?? from) };
  }
  return (
    <div>
      <CreateHeader
        section="fields"
        title={copy.new}
        lead={anchor ? copy.newAnchorLead : copy.newLead}
      />
      {catalogue ? (
        <CustomFieldForm
          initial={start}
          lists={Object.entries(catalogue.domains)
            .filter(([key]) => key !== "file_format")
            .map(([key, list]) => ({
              value: key,
              label: label(list.labels, locale),
            }))}
          // The anchor files its fields under the catalogue's categories.
          categories={
            anchor
              ? catalogue.categories.map((category) => ({
                  value: category.id,
                  label: label(category.labels, locale),
                }))
              : undefined
          }
          // The file formats a field of its own may take: the catalogue's.
          formats={catalogue.domains.file_format.codes.map((code) => ({
            value: String(code.value),
            label: code.labels[locale] ?? code.labels.en,
          }))}
        />
      ) : (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
