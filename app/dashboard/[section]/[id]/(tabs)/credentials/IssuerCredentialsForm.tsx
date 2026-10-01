"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Select } from "@/app/components/Select";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { useI18n } from "@/app/i18n/client";
import {
  saveIssuerCredentialTypes,
  type IssuerCredentialsState,
} from "@/app/lib/credential-actions";

/**
 * The issuable credential types by category, those the issuer grants ticked;
 * each ticked one may take one of the tenant's request forms, which offers it.
 */
export function IssuerCredentialsForm({
  issuerId,
  chosen,
  offered,
  forms,
  groups,
}: {
  issuerId: string;
  chosen: string[];
  /** The form for each type it offers, by type id. */
  offered: Record<string, string>;
  /** The tenant's forms. */
  forms: { id: string; name: string }[];
  groups: {
    label: string;
    types: { id: string; label: string; description: string }[];
  }[];
}) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;
  const [state, action, pending] = useActionState<
    IssuerCredentialsState,
    FormData
  >(saveIssuerCredentialTypes.bind(null, issuerId), {});
  const [ticked, setTicked] = useState<string[]>(chosen);

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-5" action={action}>
        <p className="text-sm text-muted-foreground">
          {copy.issuesLead}{" "}
          <Link
            href="/dashboard/catalogue/credentials"
            className="text-primary hover:underline"
          >
            {copy.seeCatalogue}
          </Link>
        </p>
        {groups.map((group) => (
          <fieldset key={group.label} className="grid gap-2">
            <legend className="mb-1.5 text-[13px] font-semibold text-muted-foreground">
              {group.label}
            </legend>
            {group.types.map((type) => (
              <div
                key={type.id}
                className="grid gap-2.5 rounded-lg border border-input px-3.5 py-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-brand-soft"
              >
                <Label className="flex cursor-pointer items-start gap-2.5 font-normal">
                  <Checkbox
                    name="types"
                    value={type.id}
                    checked={ticked.includes(type.id)}
                    onCheckedChange={(checked) =>
                      setTicked((all) =>
                        checked === true
                          ? [...all, type.id]
                          : all.filter((id) => id !== type.id),
                      )
                    }
                    className="mt-0.5"
                  />
                  <span className="grid gap-0.5">
                    <span className="font-semibold">{type.label}</span>
                    <span className="text-[13px] text-muted-foreground">
                      {type.description}
                    </span>
                  </span>
                </Label>
                {ticked.includes(type.id) && (
                  <div className="grid gap-1.5 pl-6.5">
                    <Label htmlFor={`form-${type.id}`} className="text-[13px]">
                      {copy.requestForm}
                    </Label>
                    <Select
                      id={`form-${type.id}`}
                      name={`form.${type.id}`}
                      defaultValue={offered[type.id] ?? ""}
                      options={[
                        { value: "", label: copy.notOffered },
                        ...forms.map((form) => ({
                          value: form.id,
                          label: form.name,
                        })),
                      ]}
                    />
                  </div>
                )}
              </div>
            ))}
          </fieldset>
        ))}
        {state.error && !pending && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {state.error === "invalid"
                ? copy.errors.typeInvalid
                : state.error === "formInvalid"
                  ? copy.errors.formInvalid
                  : copy.errors.unavailable}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-end gap-3">
          {state.saved && !pending && (
            <span className="text-[13px] text-muted-foreground" role="status">
              {copy.saved}
            </span>
          )}
          <Button type="submit" disabled={pending}>
            {copy.saveTypes}
          </Button>
        </div>
      </form>
    </Card>
  );
}
