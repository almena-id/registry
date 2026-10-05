import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import {
  fetchCredentialCatalogue,
  fetchOwnCredentialTypes,
} from "@/app/lib/credential-catalog";
import { fetchTenantCatalogue } from "@/app/lib/field-catalog";
import { label } from "@/app/lib/form-fields";
import { CredentialTypeForm } from "../../new/CredentialTypeForm";
import { draftOfType } from "../../type-draft";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.editType,
  };
}

/**
 * Change one of the account's credential types — the trust anchor's: one of
 * Almena's —, its key fixed. While something uses it, the API takes new words
 * and optional claims only.
 */
export default async function EditCredentialTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ t, locale }, catalogue, credentials, own, tenant] =
    await Promise.all([
      getI18n(),
      fetchTenantCatalogue(),
      fetchCredentialCatalogue(),
      fetchOwnCredentialTypes(),
      currentTenant(),
    ]);
  const anchor = tenant?.anchor ?? false;
  // The anchor keeps Almena's; any other account its own, when its
  // subscription allows it.
  if (!anchor && !tenant?.features.includes("own_credential_types")) notFound();
  const copy = t.dashboard.catalogue;
  if (!catalogue || !credentials || !own)
    return (
      <div>
        <CreateHeader section="credentialTypes" title={copy.editType} lead="" />
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      </div>
    );
  const item = own.find((entry) => entry.id === id);
  if (!item) notFound();
  const kind = item.type;
  return (
    <div>
      <CreateHeader
        section="credentialTypes"
        title={copy.editType}
        lead={copy.editTypeLead.replace("{label}", label(kind.labels, locale))}
      />
      <CredentialTypeForm
        anchor={anchor}
        categories={credentials.categories.map((category) => ({
          value: category.id,
          label: label(category.labels, locale),
        }))}
        // Credentials carry no files.
        fields={catalogue.fields
          .filter((field) => field.type !== "file")
          .map((field) => ({
            value: field.id,
            label: label(field.labels, locale),
          }))}
        edit={{ id: item.id, initial: draftOfType(item.key, kind) }}
      />
    </div>
  );
}
