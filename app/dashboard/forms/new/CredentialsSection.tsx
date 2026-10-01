"use client";

import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import type {
  CredentialCatalogue,
  CredentialType,
  PublishedIssuer,
} from "@/app/lib/credential-catalog";
import {
  byId,
  fillsOf,
  label,
  type Catalogue,
  type CredentialDraft,
  type CredentialProblem,
  type FieldDraft,
} from "@/app/lib/form-fields";

const small = "text-[13px] text-muted-foreground font-normal";

/**
 * The credentials a form asks to be presented: each a type of Almena's
 * catalogue, with the claims wanted, whether it is required, why it is asked
 * for and whom it is trusted from. Each shows, as the form changes, the fields
 * it fills: those named as its claims.
 */
export function CredentialsSection({
  credentials,
  catalogue,
  issuers,
  drafts,
  onChange,
  fields,
  error,
}: {
  credentials: CredentialCatalogue;
  catalogue: Catalogue;
  issuers: PublishedIssuer[];
  drafts: CredentialDraft[];
  onChange: (drafts: CredentialDraft[]) => void;
  fields: FieldDraft[];
  error?: { id: string; problem: CredentialProblem };
}) {
  const { t } = useI18n();
  const copy = t.dashboard.forms;
  const next = useRef(0);
  const types = useMemo(
    () => new Map(credentials.types.map((type) => [type.id, type])),
    [credentials],
  );

  const add = (type: CredentialType) =>
    onChange([
      ...drafts,
      {
        id: `c${next.current++}`,
        key: type.id,
        type: type.id,
        required: true,
        purpose: {},
        claims: type.claims.map((claim) => claim.field),
        trust: type.issuance === "external" ? "framework" : "registry",
        issuers: [],
      },
    ]);

  return (
    <section className="grid gap-3" aria-labelledby="credentials-title">
      <div>
        <h2 id="credentials-title" className="text-lg font-semibold">
          {copy.credentials}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {copy.credentialsHint}
        </p>
      </div>
      {drafts.map((draft) => {
        const type = types.get(draft.type);
        return (
          type && (
            <CredentialEditor
              key={draft.id}
              type={type}
              draft={draft}
              catalogue={catalogue}
              issuers={issuers.filter((issuer) =>
                issuer.credential_types?.includes(type.id),
              )}
              fields={fields}
              problem={error?.id === draft.id ? error.problem : undefined}
              onChange={(patch) =>
                onChange(
                  drafts.map((d) =>
                    d.id === draft.id ? { ...d, ...patch } : d,
                  ),
                )
              }
              onRemove={() => onChange(drafts.filter((d) => d.id !== draft.id))}
            />
          )
        );
      })}
      <CredentialPicker
        credentials={credentials}
        taken={new Set(drafts.map((draft) => draft.type))}
        onPick={add}
      />
    </section>
  );
}

/** "Add credential": the credential types, searchable, by category. */
function CredentialPicker({
  credentials,
  taken,
  onPick,
}: {
  credentials: CredentialCatalogue;
  taken: Set<string>;
  onPick: (type: CredentialType) => void;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.forms;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="justify-self-start">
          <PlusIcon />
          {copy.addCredential}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder={copy.searchCredentials} />
          <CommandList>
            <CommandEmpty>{copy.noMatch}</CommandEmpty>
            {credentials.categories.map((category) => (
              <CommandGroup
                key={category.id}
                heading={label(category.labels, locale)}
              >
                {credentials.types
                  .filter((type) => type.category === category.id)
                  .map((type) => {
                    const used = taken.has(type.id);
                    return (
                      <CommandItem
                        key={type.id}
                        value={`${label(type.labels, locale)} ${type.id}`}
                        disabled={used}
                        onSelect={() => {
                          onPick(type);
                          setOpen(false);
                        }}
                      >
                        <span className="flex-1">
                          {label(type.labels, locale)}
                        </span>
                        {used && (
                          <CheckIcon className="text-muted-foreground" />
                        )}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** One credential the form asks for. */
function CredentialEditor({
  type,
  draft,
  catalogue,
  issuers,
  fields,
  problem,
  onChange,
  onRemove,
}: {
  type: CredentialType;
  draft: CredentialDraft;
  catalogue: Catalogue;
  /** Published issuers granting the type. */
  issuers: PublishedIssuer[];
  fields: FieldDraft[];
  problem?: CredentialProblem;
  onChange: (patch: Partial<CredentialDraft>) => void;
  onRemove: () => void;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.forms;
  const fieldsById = byId(catalogue);
  const id = (name: string) => `${draft.id}-${name}`;
  const claimLabel = (field: string) => {
    const item = fieldsById.get(field);
    return item ? label(item.labels, locale) : field;
  };
  const filled = fillsOf(
    draft.claims,
    fields.map((field) => ({
      ref: field.ref,
      as: field.as.trim() || undefined,
    })),
  );
  const toggle = (list: string[], value: string, on: boolean) =>
    on ? [...list, value] : list.filter((item) => item !== value);
  const external = type.issuance === "external";

  return (
    <Card
      className="gap-4 p-5 data-[invalid=true]:border-destructive"
      data-invalid={problem ? true : undefined}
      aria-label={label(type.labels, locale)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <span className="flex items-center gap-2 font-semibold">
            {label(type.labels, locale)}
            {external && <Badge variant="muted">{copy.issuedElsewhere}</Badge>}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {label(type.descriptions, locale)}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={copy.removeCredential}
          title={copy.removeCredential}
        >
          <Trash2Icon />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field
          data-invalid={
            problem === "credentialKeyInvalid" ||
            problem === "credentialKeyDuplicate"
              ? true
              : undefined
          }
          className="gap-1.5"
        >
          <FieldLabel htmlFor={id("key")}>
            {copy.credentialKey}{" "}
            <span className={small}>{copy.credentialKeyHint}</span>
          </FieldLabel>
          <Input
            id={id("key")}
            className="font-mono text-[13px]"
            value={draft.key}
            maxLength={64}
            spellCheck={false}
            autoCapitalize="off"
            onChange={(event) => onChange({ key: event.target.value })}
            aria-invalid={
              problem === "credentialKeyInvalid" ||
              problem === "credentialKeyDuplicate"
                ? true
                : undefined
            }
          />
        </Field>
        <FieldLabel className="flex h-9 cursor-pointer items-center gap-2 font-normal">
          <Checkbox
            checked={draft.required}
            onCheckedChange={(checked) =>
              onChange({ required: checked === true })
            }
          />
          {copy.required}
        </FieldLabel>
      </div>

      <Field className="gap-1.5">
        <FieldLabel htmlFor={id("purpose")}>
          {copy.purpose} <span className={small}>{copy.optional}</span>
        </FieldLabel>
        <MultilingualInput
          id={id("purpose")}
          value={draft.purpose}
          onChange={(purpose) => onChange({ purpose })}
          maxLength={300}
          placeholder={copy.purposeHint}
        />
      </Field>

      <FieldSet
        className="grid gap-2 rounded-lg bg-sunk p-3.5"
        aria-invalid={problem === "claimsInvalid" ? true : undefined}
      >
        <FieldLegend variant="label" className="mb-1.5 text-sm font-medium">
          {copy.claims} <span className={small}>{copy.claimsHint}</span>
        </FieldLegend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {type.claims.map((claim) => (
            <FieldLabel
              key={claim.field}
              className="flex cursor-pointer items-center gap-2 font-normal"
            >
              <Checkbox
                checked={draft.claims.includes(claim.field)}
                onCheckedChange={(checked) => {
                  const ticked = toggle(
                    draft.claims,
                    claim.field,
                    checked === true,
                  );
                  // Kept in the type's order.
                  onChange({
                    claims: type.claims
                      .map((c) => c.field)
                      .filter((field) => ticked.includes(field)),
                  });
                }}
              />
              <span className="truncate">{claimLabel(claim.field)}</span>
            </FieldLabel>
          ))}
        </div>
      </FieldSet>

      <FieldSet
        className="grid gap-2"
        aria-invalid={problem === "trustInvalid" ? true : undefined}
      >
        <FieldLegend variant="label" className="mb-1.5 text-sm font-medium">
          {copy.trust}
        </FieldLegend>
        {external ? (
          <p className="text-[13px] text-muted-foreground">
            {copy.trustFramework}
          </p>
        ) : (
          <>
            <RadioGroup
              value={draft.trust}
              onValueChange={(trust) =>
                onChange({ trust: trust as CredentialDraft["trust"] })
              }
              className="grid gap-2 sm:grid-cols-2"
            >
              {(["registry", "issuers"] as const).map((mode) => (
                <FieldLabel
                  key={mode}
                  className="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border border-input px-3.5 py-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-brand-soft dark:has-data-[state=checked]:bg-brand-soft"
                >
                  <RadioGroupItem value={mode} className="mt-0.5" />
                  <span className="text-[13px]">
                    {mode === "registry"
                      ? copy.trustRegistry
                      : copy.trustIssuers}
                  </span>
                </FieldLabel>
              ))}
            </RadioGroup>
            {draft.trust === "issuers" &&
              (issuers.length ? (
                <div className="grid gap-2 rounded-lg bg-sunk p-3.5">
                  {issuers.map((issuer) => (
                    <FieldLabel
                      key={issuer.did}
                      className="flex cursor-pointer items-center gap-2 font-normal"
                    >
                      <Checkbox
                        checked={draft.issuers.includes(issuer.did)}
                        onCheckedChange={(checked) =>
                          onChange({
                            issuers: toggle(
                              draft.issuers,
                              issuer.did,
                              checked === true,
                            ),
                          })
                        }
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{issuer.name}</span>{" "}
                        <span className="font-mono text-[11px] break-all text-faint">
                          {issuer.did}
                        </span>
                      </span>
                    </FieldLabel>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  {copy.noIssuers}
                </p>
              ))}
          </>
        )}
      </FieldSet>

      <p className="text-[13px] text-muted-foreground">
        {filled.length
          ? copy.fills.replace("{fields}", filled.map(claimLabel).join(", "))
          : copy.fillsNone}
      </p>

      {problem && (
        <FieldError className="text-[13px]">{copy.errors[problem]}</FieldError>
      )}
    </Card>
  );
}
