import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { fetchCatalogue } from "@/app/lib/field-catalog";
import { CustomFieldForm } from "./CustomFieldForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.new,
  };
}

/** A field of the account's own, for what Almena's catalogue lacks. */
export default async function NewCustomFieldPage() {
  const [{ t, locale }, catalogue] = await Promise.all([
    getI18n(),
    fetchCatalogue(),
  ]);
  const copy = t.dashboard.catalogue;
  return (
    <div>
      <CreateHeader section="catalogue" title={copy.new} lead={copy.newLead} />
      {catalogue ? (
        <CustomFieldForm
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
