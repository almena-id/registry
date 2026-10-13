import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { fetchTenantCredentialCatalogue } from "@/app/lib/credential-catalog";
import { fetchTenantCatalogue } from "@/app/lib/field-catalog";
import { fetchForm } from "@/app/lib/forms";
import { FormBuilder } from "../../new/FormBuilder";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.forms.editTitle };
}

/**
 * A form changed: the builder filled with it. While it is in use the API
 * takes only changes that take more than it took, and the builder says so.
 */
export default async function EditFormPage({
  params,
}: PageProps<"/dashboard/forms/[id]/edit">) {
  const { id } = await params;
  const [{ t }, form, catalogue, credentials] = await Promise.all([
    getI18n(),
    fetchForm(id),
    fetchTenantCatalogue(),
    fetchTenantCredentialCatalogue(),
  ]);
  if (!form) notFound();
  const copy = t.dashboard.forms;
  return (
    <div>
      <CreateHeader section="forms" title={copy.editTitle} lead={copy.editLead} />
      {catalogue && credentials ? (
        <FormBuilder
          catalogue={catalogue}
          credentials={credentials}
          form={form}
        />
      ) : (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
