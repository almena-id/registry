import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import {
  fetchTenantCredentialCatalogue,
  fetchIssuerCredentialTypes,
} from "@/app/lib/credential-catalog";
import { label } from "@/app/lib/form-fields";
import { fetchForms } from "@/app/lib/forms";
import { loadItem } from "../../load";
import { IssuerCredentialsForm } from "./IssuerCredentialsForm";

/**
 * Credentials: the types of Almena's catalogue an issuer grants, ticked by
 * any member, and for each the form holders fill in to apply — which makes it
 * an offer, listed in the public catalogue of credentials. The public catalogue of issuers lists them, so holders find who
 * grants what. Types issued under a framework of their own (the EU PID) are
 * not offered. Issuers only.
 */
export default async function IssuerCredentialsTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/credentials">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded || loaded.section !== "issuers") notFound();
  if (!loaded.item) return null;
  const [{ t, locale }, catalogue, declared, forms] = await Promise.all([
    getI18n(),
    fetchTenantCredentialCatalogue(),
    fetchIssuerCredentialTypes(id),
    fetchForms(),
  ]);
  const copy = t.dashboard.catalogue;

  if (!catalogue || !declared || !forms)
    return (
      <Card className="min-w-0 gap-0 p-5">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      </Card>
    );

  return (
    <IssuerCredentialsForm
      issuerId={id}
      chosen={declared.types}
      offered={declared.forms}
      forms={forms.map((form) => ({
        id: form.id,
        name: label(form.name, locale),
      }))}
      groups={catalogue.categories
        .map((category) => ({
          label: label(category.labels, locale),
          types: catalogue.types
            .filter(
              (item) =>
                item.category === category.id && item.issuance === "almena",
            )
            .map((item) => ({
              id: item.id,
              label: label(item.labels, locale),
              description: label(item.descriptions, locale),
            })),
        }))
        .filter((group) => group.types.length > 0)}
    />
  );
}
