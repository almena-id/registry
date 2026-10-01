"use client";

import { useState } from "react";

import { Select } from "@/app/components/Select";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import {
  removeApplicationFile,
  uploadApplicationFile,
} from "@/app/lib/application-actions";
import type { FileMeta } from "@/app/lib/applications";
import {
  label,
  type CatalogueField,
  type Code,
  type Narrow,
} from "@/app/lib/form-fields";

/** The value lists of Almena's domains, by id. */
export type Domains = Record<string, Code[]>;

const small = "text-[13px] text-muted-foreground font-normal";

/** The codes a field offers: its own, or its domain's, as the form narrows them. */
function codesFor(field: CatalogueField, narrow: Narrow, domains: Domains) {
  let codes =
    field.codes ?? (field.domain ? (domains[field.domain] ?? []) : []);
  if (field.values)
    codes = codes.filter((c) => field.values?.includes(c.value));
  if (narrow.values)
    codes = codes.filter((c) => narrow.values?.includes(c.value));
  return codes;
}

/**
 * One field of the catalogue as somebody fills it in, by its type: text,
 * email, phone, date, one or several of a list, a file (uploaded at once to
 * the application) or a group of fields — a holder's answer, or a claim an
 * issuer settles. `error` is the problem the registry found, by code.
 */
export function FieldInput({
  id,
  applicationId,
  field,
  narrow,
  required,
  help,
  value,
  onChange,
  domains,
  error,
  file,
  onFile,
}: {
  id: string;
  applicationId: string;
  field: CatalogueField;
  narrow: Narrow;
  required: boolean;
  help?: string;
  value: unknown;
  onChange: (value: unknown) => void;
  domains: Domains;
  /** By key: the field's own, or `{part}` for a group's parts. */
  error?: Record<string, string>;
  file?: FileMeta;
  onFile?: (file: FileMeta | null) => void;
}) {
  const { t, locale } = useI18n();
  const copy = t.apply;
  const title = label(field.labels, locale);
  const own = error?.[""];
  const problem = (code?: string) =>
    code
      ? (copy.problems[code as keyof typeof copy.problems] ??
        copy.problems.format)
      : null;

  const head = (
    <FieldLabel htmlFor={id}>
      {title} {!required && <span className={small}>{copy.optional}</span>}
    </FieldLabel>
  );
  const foot = (
    <>
      {help && <p className="text-[13px] text-faint">{help}</p>}
      {own && <FieldError className="text-[13px]">{problem(own)}</FieldError>}
    </>
  );

  if (field.type === "group")
    return (
      <FieldSet className="grid gap-3 rounded-lg border p-3.5">
        <FieldLegend variant="label" className="px-1 text-sm font-medium">
          {title} {!required && <span className={small}>{copy.optional}</span>}
        </FieldLegend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(field.parts ?? []).map((part) => {
            const group = (value ?? {}) as Record<string, unknown>;
            return (
              <FieldInput
                key={part.key}
                id={`${id}-${part.key}`}
                applicationId={applicationId}
                field={part.field}
                narrow={{}}
                required={part.required}
                value={group[part.key]}
                onChange={(next) => onChange({ ...group, [part.key]: next })}
                domains={domains}
                error={error?.[part.key] ? { "": error[part.key] } : undefined}
              />
            );
          })}
        </div>
        {foot}
      </FieldSet>
    );

  if (field.type === "codes") {
    const chosen = Array.isArray(value) ? value.map(String) : [];
    return (
      <CodesInput
        id={id}
        head={head}
        foot={foot}
        codes={codesFor(field, narrow, domains)}
        chosen={chosen}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "code")
    return (
      <Field data-invalid={own ? true : undefined} className="gap-1.5">
        {head}
        <Select
          id={id}
          name={id}
          defaultValue={
            value === undefined || value === null ? "" : String(value)
          }
          onChange={(next) => onChange(next || null)}
          aria-invalid={own ? true : undefined}
          options={[
            { value: "", label: copy.choose },
            ...codesFor(field, narrow, domains).map((code) => ({
              value: String(code.value),
              label: label(code.labels, locale),
            })),
          ]}
        />
        {foot}
      </Field>
    );

  if (field.type === "file")
    return (
      <FileInput
        id={id}
        applicationId={applicationId}
        head={head}
        foot={foot}
        fileKey={id.slice(2)}
        accept={codesFor(field, narrow, domains)
          .map((code) => code.media_type)
          .filter(Boolean)
          .join(",")}
        file={file}
        onFile={(meta) => onFile?.(meta)}
      />
    );

  const kind =
    field.type === "email"
      ? "email"
      : field.type === "phone"
        ? "tel"
        : field.type === "date"
          ? "date"
          : "text";
  return (
    <Field data-invalid={own ? true : undefined} className="gap-1.5">
      {head}
      <Input
        id={id}
        type={kind}
        value={typeof value === "string" ? value : ""}
        maxLength={narrow.max_length ?? field.max_length}
        min={kind === "date" ? narrow.min_date : undefined}
        max={kind === "date" ? narrow.max_date : undefined}
        placeholder={kind === "tel" ? "+34 600 000 000" : undefined}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={own ? true : undefined}
      />
      {foot}
    </Field>
  );
}

function CodesInput({
  id,
  head,
  foot,
  codes,
  chosen,
  onChange,
}: {
  id: string;
  head: React.ReactNode;
  foot: React.ReactNode;
  codes: Code[];
  chosen: string[];
  onChange: (values: string[]) => void;
}) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState("");
  const long = codes.length > 12;
  const wanted = filter.trim().toLocaleLowerCase(locale);
  const shown = wanted
    ? codes.filter((code) =>
        label(code.labels, locale).toLocaleLowerCase(locale).includes(wanted),
      )
    : codes;
  return (
    <Field className="gap-1.5" id={id}>
      {head}
      {long && (
        <Input
          value={filter}
          placeholder={t.apply.filter}
          aria-label={t.apply.filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      )}
      <div
        className={
          long
            ? "grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-2.5"
            : "grid grid-cols-2 gap-2"
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
      {foot}
    </Field>
  );
}

function FileInput({
  id,
  fileKey: key,
  applicationId,
  head,
  foot,
  accept,
  file,
  onFile,
}: {
  id: string;
  /** The form's key for the field: what the upload answers. */
  fileKey: string;
  applicationId: string;
  head: React.ReactNode;
  foot: React.ReactNode;
  accept: string;
  file?: FileMeta;
  onFile: (file: FileMeta | null) => void;
}) {
  const { t } = useI18n();
  const copy = t.apply;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Field className="gap-1.5">
      {head}
      {file ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="min-w-0 truncate">
            {file.filename}{" "}
            <span className="text-faint">
              ({Math.ceil(file.size / 1024)} KB)
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await removeApplicationFile(applicationId, key);
              setBusy(false);
              onFile(null);
            }}
          >
            {copy.removeFile}
          </Button>
        </div>
      ) : (
        <Input
          id={id}
          type="file"
          accept={accept}
          disabled={busy}
          onChange={async (event) => {
            const chosen = event.target.files?.[0];
            if (!chosen) return;
            setBusy(true);
            setError(null);
            const form = new FormData();
            form.set("key", key);
            form.set("file", chosen);
            const result = await uploadApplicationFile(applicationId, form);
            setBusy(false);
            if (result.ok) onFile(result.file);
            else setError(result.error);
          }}
        />
      )}
      {busy && <p className="text-[13px] text-faint">{copy.uploading}</p>}
      {error && (
        <FieldError className="text-[13px]">
          {copy.errors[error as keyof typeof copy.errors] ??
            copy.errors.unavailable}
        </FieldError>
      )}
      {foot}
    </Field>
  );
}
