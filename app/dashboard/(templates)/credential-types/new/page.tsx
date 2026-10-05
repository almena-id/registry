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
import { copyOfType } from "../type-draft";
import { CredentialTypeForm } from "./CredentialTypeForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.catalogue.newType,
  };
}

/**
 * A credential type: the trust anchor's, of Almena's catalogue, for every
 * account's issuers and forms; any other account's, of its own, for its
 * issuers and forms — when its subscription allows it.
 */
export default async function NewCredentialTypePage({
  searchParams,
}: PageProps<"/dashboard/credential-types/new">) {
  const { from } = await searchParams;
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
  // A copy of another type (`?from={ref}`): the account's own or Almena's.
  const original =
    typeof from === "string"
      ? (own?.find((item) => item.type.id === from)?.type ??
        credentials?.types.find((item) => item.id === from))
      : undefined;
  const copy = t.dashboard.catalogue;
  return (
    <div>
      <CreateHeader
        section="credentialTypes"
        title={copy.newType}
        lead={anchor ? copy.newTypeLead : copy.newOwnTypeLead}
      />
      {catalogue && credentials ? (
        <CredentialTypeForm
          anchor={anchor}
          initial={original ? copyOfType(original, anchor) : undefined}
          categories={credentials.categories.map((category) => ({
            value: category.id,
            label: label(category.labels, locale),
          }))}
          // Its claims are the catalogue's fields, in the catalogue's order;
          // credentials carry no files.
          fields={catalogue.fields
            .filter((field) => field.type !== "file")
            .map((field) => ({
              value: field.id,
              label: label(field.labels, locale),
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
