"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useI18n } from "@/app/i18n/client";
import {
  createCredentialType,
  updateCredentialType,
  type ClaimDraft,
  type CredentialTypeState,
} from "@/app/lib/credential-type-actions";
import type { Texts } from "@/app/lib/texts";
import { useAnswerRound } from "@/app/lib/use-answer-round";

type Option = { value: string; label: string };

const small = "text-[13px] text-muted-foreground font-normal";

/**
 * A credential type of Almena's catalogue: its name and description in every
 * language, its key (which names its `vct`), category and standard, its
 * claims — fields of the catalogue, each always present or not — who issues
 * it (any account's issuer, or a framework of its own with its own `vct`) and,
 * optionally, how the W3C and mdoc formats name it. With `edit`, an existing
 * one, its key fixed. Not `anchor`, an account's own: its issuers issue it,
 * its fields may be claims, one language and no standard will do.
 */
export function CredentialTypeForm({
  anchor,
  categories,
  fields,
  edit,
  initial,
}: {
  anchor: boolean;
  categories: Option[];
  fields: Option[];
  edit?: { id: string; initial: CredentialTypeState };
  /** A new one's start: a copy of another. */
  initial?: CredentialTypeState;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;
  const [state, action, pending] = useActionState<
    CredentialTypeState,
    FormData
  >(
    edit ? updateCredentialType.bind(null, edit.id) : createCredentialType,
    edit?.initial ?? initial ?? {},
  );
  const round = useAnswerRound(state);
  const [labels, setLabels] = useState<Texts>(state.labels ?? {});
  const [descriptions, setDescriptions] = useState<Texts>(
    state.descriptions ?? {},
  );
  const [claims, setClaims] = useState<ClaimDraft[]>(state.claims ?? []);
  const [issuance, setIssuance] = useState(state.issuance || "almena");
  const error = state.error;
  const invalid = (...keys: (typeof error)[]) =>
    keys.includes(error) ? true : undefined;

  const claimed = new Map(claims.map((claim) => [claim.field, claim]));
  // Kept in the catalogue's order, whatever order they were ticked in.
  const setClaim = (field: string, claim: ClaimDraft | null) =>
    setClaims((all) => {
      const next = new Map(all.map((item) => [item.field, item]));
      if (claim) next.set(field, claim);
      else next.delete(field);
      return fields
        .map((option) => next.get(option.value))
        .filter((item): item is ClaimDraft => Boolean(item));
    });

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        <input type="hidden" name="claims" value={JSON.stringify(claims)} />
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors[error]}</AlertDescription>
          </Alert>
        )}

        <Field className="gap-1.5">
          <FieldLabel htmlFor="labels" className="items-baseline">
            {copy.typeName}
          </FieldLabel>
          <MultilingualInput
            id="labels"
            name="labels"
            value={labels}
            onChange={setLabels}
            maxLength={200}
            autoFocus
            invalid={invalid("labelsEvery")}
            describedBy="labels-hint"
          />
          <FieldDescription className="text-[13px] text-faint" id="labels-hint">
            {anchor ? copy.labelsEveryHint : copy.labelsHint}
          </FieldDescription>
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="descriptions" className="items-baseline">
            {copy.typeDescription}
          </FieldLabel>
          <MultilingualInput
            id="descriptions"
            name="descriptions"
            value={descriptions}
            onChange={setDescriptions}
            multiline
            maxLength={500}
            invalid={invalid("descriptionsEvery")}
          />
        </Field>

        <div className="grid items-end gap-3 sm:grid-cols-3">
          <Field
            data-invalid={invalid("keyRequired", "keyInvalid", "typeKeyExists")}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="key" className="items-baseline">
              {copy.key}{" "}
              <span className={small}>
                {edit ? copy.keyFixed : copy.typeKeyHint}
              </span>
            </FieldLabel>
            <Input
              id="key"
              name="key"
              className="font-mono text-[13px]"
              maxLength={64}
              spellCheck={false}
              autoCapitalize="off"
              defaultValue={state.key}
              disabled={Boolean(edit)}
              aria-invalid={invalid(
                "keyRequired",
                "keyInvalid",
                "typeKeyExists",
              )}
            />
          </Field>
          <Field data-invalid={invalid("categoryRequired")} className="gap-1.5">
            <FieldLabel htmlFor="category" className="items-baseline">
              {copy.category}
            </FieldLabel>
            <Select
              key={round}
              id="category"
              name="category"
              defaultValue={state.category}
              options={[{ value: "", label: copy.choose }, ...categories]}
              aria-invalid={invalid("categoryRequired")}
            />
          </Field>
          <Field data-invalid={invalid("sourceRequired")} className="gap-1.5">
            <FieldLabel htmlFor="source" className="items-baseline">
              {copy.source}{" "}
              <span className={small}>
                {anchor ? copy.sourceHint : copy.optional}
              </span>
            </FieldLabel>
            <Input
              id="source"
              name="source"
              maxLength={200}
              defaultValue={state.source}
              placeholder="schema.org EmployeeRole"
              aria-invalid={invalid("sourceRequired")}
            />
          </Field>
        </div>

        <FieldSet
          data-invalid={invalid("claimsInvalid")}
          className="grid gap-2 rounded-lg bg-sunk p-3.5"
        >
          <FieldLegend
            variant="label"
            className="mb-1.5 flex items-baseline gap-2 text-sm font-medium"
          >
            {copy.claims} <span className={small}>{copy.claimsHint}</span>
          </FieldLegend>
          <ul className="grid max-h-80 gap-1 overflow-y-auto">
            {fields.map((field) => {
              const claim = claimed.get(field.value);
              return (
                <li
                  key={field.value}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
                >
                  <FieldLabel className="flex cursor-pointer items-center gap-2 font-normal">
                    <Checkbox
                      checked={Boolean(claim)}
                      onCheckedChange={(checked) =>
                        setClaim(
                          field.value,
                          checked
                            ? { field: field.value, required: true }
                            : null,
                        )
                      }
                    />
                    {field.label}
                    <span className="font-mono text-[12px] text-faint">
                      {field.value}
                    </span>
                  </FieldLabel>
                  {claim && (
                    <FieldLabel className="flex cursor-pointer items-center gap-2 text-[13px] font-normal text-muted-foreground">
                      <Checkbox
                        checked={claim.required}
                        onCheckedChange={(checked) =>
                          setClaim(field.value, {
                            field: field.value,
                            required: checked === true,
                          })
                        }
                      />
                      {copy.mandatory}
                    </FieldLabel>
                  )}
                </li>
              );
            })}
          </ul>
        </FieldSet>

        {anchor && (
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="issuance" className="items-baseline">
                {copy.issuance}
              </FieldLabel>
              <Select
                key={round}
                id="issuance"
                name="issuance"
                defaultValue={issuance}
                onChange={setIssuance}
                options={[
                  { value: "almena", label: copy.issuedByAccounts },
                  { value: "external", label: copy.external },
                ]}
              />
            </Field>
            {issuance === "external" && (
              <Field data-invalid={invalid("vctInvalid")} className="gap-1.5">
                <FieldLabel htmlFor="vct" className="items-baseline">
                  vct <span className={small}>{copy.vctHint}</span>
                </FieldLabel>
                <Input
                  id="vct"
                  name="vct"
                  className="font-mono text-[13px]"
                  maxLength={500}
                  spellCheck={false}
                  placeholder="urn:eudi:pid:1"
                  defaultValue={state.vct}
                  aria-invalid={invalid("vctInvalid")}
                />
              </Field>
            )}
          </div>
        )}

        <div className="grid items-end gap-3 sm:grid-cols-2">
          <Field data-invalid={invalid("w3cTypeInvalid")} className="gap-1.5">
            <FieldLabel htmlFor="w3c_type">
              {copy.w3cType} <span className={small}>{copy.optional}</span>
            </FieldLabel>
            <Input
              id="w3c_type"
              name="w3c_type"
              className="font-mono text-[13px]"
              maxLength={100}
              spellCheck={false}
              placeholder="EmploymentCredential"
              defaultValue={state.w3c_type}
              aria-invalid={invalid("w3cTypeInvalid")}
            />
          </Field>
          <Field data-invalid={invalid("doctypeInvalid")} className="gap-1.5">
            <FieldLabel htmlFor="mdoc_doctype" className="items-baseline">
              {copy.doctype} <span className={small}>{copy.optional}</span>
            </FieldLabel>
            <Input
              id="mdoc_doctype"
              name="mdoc_doctype"
              className="font-mono text-[13px]"
              maxLength={200}
              spellCheck={false}
              placeholder="org.example.employment.1"
              defaultValue={state.mdoc_doctype}
              aria-invalid={invalid("doctypeInvalid")}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard/credential-types">{copy.cancel}</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {edit ? copy.saveChanges : copy.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
