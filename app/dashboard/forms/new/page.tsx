import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { getI18n } from "@/app/i18n/server";
import {
  fetchCredentialCatalogue,
  fetchPublishedIssuers,
} from "@/app/lib/credential-catalog";
import { fetchTenantCatalogue } from "@/app/lib/field-catalog";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { FormBuilder } from "./FormBuilder";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.forms.new,
  };
}

/**
 * A new form: its fields picked from the catalogue, the credentials it asks
 * to be presented from the credential types, trusted from published issuers.
 */
export default async function NewFormPage() {
  const [{ t }, catalogue, credentials, issuers] = await Promise.all([
    getI18n(),
    fetchTenantCatalogue(),
    fetchCredentialCatalogue(),
    fetchPublishedIssuers(),
  ]);
  const copy = t.dashboard.forms;
  return (
    <div>
      <CreateHeader section="forms" title={copy.new} lead={copy.newLead} />
      {catalogue && credentials ? (
        <FormBuilder
          catalogue={catalogue}
          credentials={credentials}
          issuers={issuers ?? []}
        />
      ) : (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
