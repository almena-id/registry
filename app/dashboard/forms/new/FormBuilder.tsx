"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
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
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import type { CredentialCatalogue } from "@/app/lib/credential-catalog";
import { createForm, type FormState } from "@/app/lib/form-actions";
import type { Texts } from "@/app/lib/texts";
import {
  byId,
  codesOf,
  draftFor,
  label,
  type Catalogue,
  type CatalogueField,
  type CredentialDraft,
  type FieldDraft,
  type FieldProblem,
} from "@/app/lib/form-fields";
import { CredentialsSection } from "./CredentialsSection";

/**
 * A new form — the same whoever puts it, an issuer's offer or a verifier's:
 * its name and description, and its fields in order — each picked from Almena's
 * catalogue. The form only says whether a field is required, adds a line of
 * help, names a repeatable one (a file asked for twice) and, where the field
 * allows it, makes it stricter: fewer values or formats, a date range, a
 * shorter text. Below them, the credentials it asks to be presented
 * (`CredentialsSection`). Fields and credentials travel as JSON, one hidden
 * input each.
 */
export function FormBuilder({
  catalogue,
  credentials,
}: {
  catalogue: Catalogue;
  credentials: CredentialCatalogue;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.forms;
  const [state, action, pending] = useActionState<FormState, FormData>(
    createForm,
    {},
  );
  const next = useRef(0);
  const [fields, setFields] = useState<FieldDraft[]>([]);
  // By language; kept across answers, as the fields are.
  const [name, setName] = useState<Texts>(state.name ?? {});
  const [description, setDescription] = useState<Texts>(
    state.description ?? {},
  );
  const [asked, setAsked] = useState<CredentialDraft[]>([]);
  const errors = state.errors ?? {};
  const fieldsById = useMemo(() => byId(catalogue), [catalogue]);

  const change = (id: string, patch: Partial<FieldDraft>) =>
    setFields((all) =>
      all.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  const move = (index: number, by: number) =>
    setFields((all) => {
      const moved = [...all];
      [moved[index], moved[index + by]] = [moved[index + by], moved[index]];
      return moved;
    });
  const add = (ref: string) =>
    setFields((all) => {
      const uses = all.filter((field) => field.ref === ref).length;
      // A repeatable field asked for again needs a name of its own.
      const as = uses ? `${ref}_${uses + 1}` : "";
      return [...all, draftFor(`f${next.current++}`, ref, as)];
    });

  return (
    <form className="flex flex-col gap-5" action={action} noValidate>
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <input type="hidden" name="credentials" value={JSON.stringify(asked)} />
      {errors.form && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors[errors.form]}</AlertDescription>
        </Alert>
      )}

      <Card className="gap-[18px] p-6">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="name">{copy.name}</FieldLabel>
          <MultilingualInput
            id="name"
            name="name"
            value={name}
            onChange={setName}
            maxLength={200}
            autoFocus
            invalid={Boolean(errors.name)}
            describedBy={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <FieldError className="text-[13px]" id="name-error">
              {copy.errors[errors.name]}
            </FieldError>
          )}
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="description">
            {copy.description}{" "}
            <span className="font-normal text-faint">{copy.optional}</span>
          </FieldLabel>
          <MultilingualInput
            id="description"
            name="description"
            value={description}
            onChange={setDescription}
            multiline
            maxLength={2000}
            placeholder={copy.descriptionHint}
            invalid={Boolean(errors.description)}
          />
          {errors.description && (
            <FieldError className="text-[13px]">
              {copy.errors[errors.description]}
            </FieldError>
          )}
        </Field>
      </Card>

      <section className="grid gap-3" aria-labelledby="fields-title">
        <div>
          <h2 id="fields-title" className="text-lg font-semibold">
            {copy.fields}
          </h2>
          <p className="text-[13px] text-muted-foreground">{copy.fieldsHint}</p>
        </div>
        {fields.length === 0 && (
          <p className="rounded-xl border border-dashed px-5 py-8 text-center text-faint">
            {copy.noFields}
          </p>
        )}
        {fields.map((field, index) => {
          const item = fieldsById.get(field.ref);
          return (
            item && (
              <FieldEditor
                key={field.id}
                catalogue={catalogue}
                item={item}
                field={field}
                index={index}
                last={index === fields.length - 1}
                problem={
                  errors.field?.id === field.id
                    ? errors.field.problem
                    : undefined
                }
                onChange={(patch) => change(field.id, patch)}
                onMove={(by) => move(index, by)}
                onRemove={() =>
                  setFields((all) => all.filter((f) => f.id !== field.id))
                }
              />
            )
          );
        })}
        <FieldPicker
          catalogue={catalogue}
          taken={new Set(fields.map((field) => field.ref))}
          onPick={add}
        />
      </section>

      <CredentialsSection
        credentials={credentials}
        catalogue={catalogue}
        drafts={asked}
        onChange={setAsked}
        fields={fields}
        error={errors.credential}
      />

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/dashboard/forms">{copy.cancel}</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {copy.save}
        </Button>
      </div>
    </form>
  );
}

/** "Add field": the catalogue, searchable, by category. */
function FieldPicker({
  catalogue,
  taken,
  onPick,
}: {
  catalogue: Catalogue;
  /** Fields already in the form: only repeatable ones are offered again. */
  taken: Set<string>;
  onPick: (ref: string) => void;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.forms;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="justify-self-start">
          <PlusIcon />
          {copy.addField}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder={copy.search} />
          <CommandList>
            <CommandEmpty>{copy.noMatch}</CommandEmpty>
            {catalogue.categories.map((category) => (
              <CommandGroup
                key={category.id}
                heading={label(category.labels, locale)}
              >
                {catalogue.fields
                  .filter((field) => field.category === category.id)
                  .map((field) => {
                    const used = taken.has(field.id) && !field.repeatable;
                    return (
                      <CommandItem
                        key={field.id}
                        value={`${label(field.labels, locale)} ${field.id}`}
                        disabled={used}
                        onSelect={() => {
                          onPick(field.id);
                          setOpen(false);
                        }}
                      >
                        <span className="flex-1">
                          {label(field.labels, locale)}
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

const small = "text-[13px] text-muted-foreground font-normal";

/** One field of the form being written: a catalogue field and what the form adds. */
function FieldEditor({
  catalogue,
  item,
  field,
  index,
  last,
  problem,
  onChange,
  onMove,
  onRemove,
}: {
  catalogue: Catalogue;
  item: CatalogueField;
  field: FieldDraft;
  index: number;
  last: boolean;
  problem?: FieldProblem | "keyDuplicate";
  onChange: (patch: Partial<FieldDraft>) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.forms;
  const id = (name: string) => `${field.id}-${name}`;
  const narrowing = new Set(item.narrowing ?? []);

  return (
    <Card
      className="gap-4 p-5 data-[invalid=true]:border-destructive"
      data-invalid={problem ? true : undefined}
      aria-label={label(item.labels, locale)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <span className="font-semibold">
            <span className="mr-2 text-[13px] text-muted-foreground tabular-nums">
              {index + 1}.
            </span>
            {label(item.labels, locale)}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {copy.types[item.type]} ·{" "}
            {copy.source.replace("{source}", item.source)}
          </span>
          {item.parts && (
            <span className="text-[13px] text-muted-foreground">
              {copy.includes}{" "}
              {item.parts
                .map((part) => label(part.field.labels, locale))
                .join(", ")}
            </span>
          )}
        </div>
        <span className="flex flex-none gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={copy.moveUp}
            title={copy.moveUp}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={last}
            onClick={() => onMove(1)}
            aria-label={copy.moveDown}
            title={copy.moveDown}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={copy.removeField}
            title={copy.removeField}
          >
            <Trash2Icon />
          </Button>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        {item.repeatable ? (
          <Field
            data-invalid={
              problem === "keyInvalid" || problem === "keyDuplicate"
                ? true
                : undefined
            }
            className="gap-1.5"
          >
            <FieldLabel htmlFor={id("as")}>
              {copy.as} <span className={small}>{copy.asHint}</span>
            </FieldLabel>
            <Input
              id={id("as")}
              className="font-mono text-[13px]"
              value={field.as}
              placeholder={item.id}
              maxLength={64}
              spellCheck={false}
              autoCapitalize="off"
              onChange={(event) => onChange({ as: event.target.value })}
              aria-invalid={
                problem === "keyInvalid" || problem === "keyDuplicate"
                  ? true
                  : undefined
              }
            />
          </Field>
        ) : (
          <span />
        )}
        <FieldLabel className="flex h-9 cursor-pointer items-center gap-2 font-normal">
          <Checkbox
            checked={field.required}
            onCheckedChange={(checked) =>
              onChange({ required: checked === true })
            }
          />
          {copy.required}
        </FieldLabel>
      </div>

      <Field className="gap-1.5">
        <FieldLabel htmlFor={id("help")}>
          {copy.help} <span className={small}>{copy.optional}</span>
        </FieldLabel>
        <MultilingualInput
          id={id("help")}
          value={field.help}
          onChange={(help) => onChange({ help })}
          maxLength={500}
          placeholder={copy.helpHint}
        />
      </Field>

      {narrowing.size > 0 && (
        <div className="grid gap-3 rounded-lg bg-sunk p-3.5 sm:grid-cols-2">
          <p className="text-[13px] font-semibold text-muted-foreground sm:col-span-2">
            {copy.restrict}
          </p>
          {narrowing.has("values") && (
            <ValuesPicker
              catalogue={catalogue}
              item={item}
              chosen={field.values}
              onChange={(values) => onChange({ values })}
              invalid={problem === "narrowInvalid"}
            />
          )}
          {(["min_date", "max_date"] as const)
            .filter((bound) => narrowing.has(bound))
            .map((bound) => (
              <Field
                data-invalid={problem === "narrowInvalid" ? true : undefined}
                key={bound}
                className="gap-1.5"
              >
                <FieldLabel htmlFor={id(bound)}>
                  {copy.bounds[bound]}{" "}
                  <span className={small}>{copy.optional}</span>
                </FieldLabel>
                <Input
                  id={id(bound)}
                  type="date"
                  value={field[bound]}
                  onChange={(event) =>
                    onChange({ [bound]: event.target.value })
                  }
                  aria-invalid={problem === "narrowInvalid" ? true : undefined}
                />
              </Field>
            ))}
          {narrowing.has("max_length") && (
            <Field
              data-invalid={problem === "narrowInvalid" ? true : undefined}
              className="gap-1.5"
            >
              <FieldLabel htmlFor={id("max_length")}>
                {copy.bounds.max_length}{" "}
                <span className={small}>{copy.optional}</span>
              </FieldLabel>
              <Input
                id={id("max_length")}
                type="number"
                min={1}
                max={item.max_length}
                placeholder={
                  item.max_length ? String(item.max_length) : undefined
                }
                value={field.max_length}
                onChange={(event) =>
                  onChange({ max_length: event.target.value })
                }
                aria-invalid={problem === "narrowInvalid" ? true : undefined}
              />
            </Field>
          )}
        </div>
      )}

      {problem && (
        <FieldError className="text-[13px]">{copy.errors[problem]}</FieldError>
      )}
    </Card>
  );
}

/**
 * The values of a coded field (countries, languages…) or a file's formats:
 * ticking some accepts only those; none ticked accepts them all. Long lists
 * get a filter.
 */
function ValuesPicker({
  catalogue,
  item,
  chosen,
  onChange,
  invalid,
}: {
  catalogue: Catalogue;
  item: CatalogueField;
  chosen: string[];
  onChange: (values: string[]) => void;
  invalid: boolean;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.forms;
  const [filter, setFilter] = useState("");
  const codes = codesOf(catalogue, item);
  const long = codes.length > 16;
  const wanted = filter.trim().toLocaleLowerCase(locale);
  const shown = wanted
    ? codes.filter((code) =>
        `${label(code.labels, locale)} ${code.value}`
          .toLocaleLowerCase(locale)
          .includes(wanted),
      )
    : codes;

  return (
    <FieldSet
      className="grid gap-2 sm:col-span-2"
      aria-invalid={invalid ? true : undefined}
    >
      <FieldLegend variant="label" className="mb-1.5 text-sm font-medium">
        {item.type === "file" ? copy.formats : copy.values}{" "}
        <span className={small}>
          {chosen.length
            ? copy.chosen.replace("{count}", String(chosen.length))
            : copy.valuesHint}
        </span>
      </FieldLegend>
      {long && (
        <Input
          value={filter}
          placeholder={copy.filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label={copy.filter}
        />
      )}
      <div
        className={
          long
            ? "grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border bg-background p-2.5 sm:grid-cols-3"
            : "grid grid-cols-2 gap-2 sm:grid-cols-3"
        }
      >
        {shown.map((code) => {
          const value = String(code.value);
          return (
            <FieldLabel
              key={value}
              className="flex cursor-pointer items-center gap-2 font-normal"
            >
              <Checkbox
                checked={chosen.includes(value)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked === true
                      ? [...chosen, value]
                      : chosen.filter((v) => v !== value),
                  )
                }
              />
              <span className="truncate">{label(code.labels, locale)}</span>
            </FieldLabel>
          );
        })}
      </div>
    </FieldSet>
  );
}
