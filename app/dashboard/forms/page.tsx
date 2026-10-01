import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { fetchCredentialCatalogue } from "@/app/lib/credential-catalog";
import { fetchTenantCatalogue } from "@/app/lib/field-catalog";
import {
  byId,
  describe,
  label,
  type Catalogue,
  type CredentialRequest,
} from "@/app/lib/form-fields";
import { formatDateTime } from "@/app/lib/format";
import { fetchForms } from "@/app/lib/forms";
import { FormRow } from "./FormRow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.forms.title,
  };
}

/**
 * Forms: what the account puts to people in its flows — so far, what a
 * holder fills in to ask one of its issuers for a credential. A list like
 * every other, "Create" above it on the right; each row opens to show the
 * form's fields — each from Almena's catalogue — and what the form
 * restricts in them. Any member creates.
 */
export default async function FormsPage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.forms;
  const [forms, catalogue, credentials, timeZone] = await Promise.all([
    fetchForms(),
    fetchTenantCatalogue(),
    fetchCredentialCatalogue(),
    getTimeZone(),
  ]);
  const fieldLabel = (field: string) => {
    const item = catalogue ? byId(catalogue).get(field) : undefined;
    return item ? label(item.labels, locale) : field;
  };
  // A credential request, worded: its type, claims, trust and what it fills.
  const credential = (request: CredentialRequest) => {
    const type = credentials?.types.find((item) => item.id === request.type);
    return {
      key: request.key,
      label: type ? label(type.labels, locale) : request.type,
      required: request.required,
      purpose: request.purpose ? label(request.purpose, locale) : undefined,
      claims: request.claims.map(fieldLabel),
      trust:
        request.trust === "issuers"
          ? copy.trustCount.replace(
              "{count}",
              String(request.issuers?.length ?? 0),
            )
          : request.trust === "framework"
            ? copy.trustFramework
            : copy.trustRegistry,
      fills: request.fills.map(fieldLabel),
    };
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.hint}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/forms/new">
            <PlusIcon />
            {copy.create}
          </Link>
        </Button>
      </header>

      <Card className="gap-0 py-0">
        {forms === null || catalogue === null || credentials === null ? (
          <div className="px-5 py-10">
            <Alert variant="destructive" role="alert">
              <AlertDescription>{copy.errors.unavailable}</AlertDescription>
            </Alert>
          </div>
        ) : forms.length === 0 ? (
          <p className="px-5 py-10 text-center text-faint">{copy.empty}</p>
        ) : (
          <ul>
            {forms.map((form) => (
              <FormRow
                key={form.id}
                form={form}
                fields={form.fields.map((field) =>
                  describe(field, catalogue as Catalogue, locale, copy),
                )}
                credentials={form.credentials.map(credential)}
                created={formatDateTime(form.created_at, locale, timeZone)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
