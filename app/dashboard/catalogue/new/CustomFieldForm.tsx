"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Select } from "@/app/components/Select";
import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import {
  createCustomField,
  type CustomFieldState,
  type OptionDraft,
} from "@/app/lib/custom-field-actions";
import type { Texts } from "@/app/lib/texts";
import { useAnswerRound } from "@/app/lib/use-answer-round";

/** The types a field of the account's own may have (no groups). */
const types = [
  "text",
  "email",
  "phone",
  "date",
  "code",
  "codes",
  "file",
] as const;

const small = "text-[13px] text-muted-foreground font-normal";
const blank = (): OptionDraft => ({ value: "", labels: {} });

/**
 * A field of the account's own: its key (never one of Almena's), its label
 * by language (one at least), its type and what the type needs — a
 * length and a pattern for text, the options of a list, the formats of a file.
 */
export function CustomFieldForm({
  formats,
}: {
  formats: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;
  const [state, action, pending] = useActionState<CustomFieldState, FormData>(
    createCustomField,
    {},
  );
  const round = useAnswerRound(state);
  const [type, setType] = useState(state.type || "text");
  const [labels, setLabels] = useState<Texts>(state.labels ?? {});
  const [options, setOptions] = useState<OptionDraft[]>(
    state.options?.length ? state.options : [blank(), blank()],
  );
  const error = state.error;
  const listed = type === "code" || type === "codes";

  const setOption = (index: number, patch: Partial<OptionDraft>) =>
    setOptions((all) =>
      all.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        <input type="hidden" name="options" value={JSON.stringify(options)} />
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors[error]}</AlertDescription>
          </Alert>
        )}

        <Field className="gap-1.5">
          <FieldLabel htmlFor="labels">{copy.label}</FieldLabel>
          <MultilingualInput
            id="labels"
            name="labels"
            value={labels}
            onChange={setLabels}
            maxLength={200}
            autoFocus
            invalid={error === "labelsRequired"}
            describedBy="labels-hint"
          />
          <FieldDescription className="text-[13px] text-faint" id="labels-hint">
            {copy.labelsHint}
          </FieldDescription>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            data-invalid={
              error === "keyInvalid" ||
              error === "keyReserved" ||
              error === "keyExists" ||
              error === "keyRequired"
                ? true
                : undefined
            }
            className="gap-1.5"
          >
            <FieldLabel htmlFor="key">
              {copy.key} <span className={small}>{copy.keyHint}</span>
            </FieldLabel>
            <Input
              id="key"
              name="key"
              className="font-mono text-[13px]"
              maxLength={64}
              spellCheck={false}
              autoCapitalize="off"
              defaultValue={state.key}
              aria-invalid={
                error === "keyInvalid" ||
                error === "keyReserved" ||
                error === "keyExists" ||
                error === "keyRequired"
                  ? true
                  : undefined
              }
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="type">{copy.type}</FieldLabel>
            <Select
              key={round}
              id="type"
              name="type"
              defaultValue={type}
              onChange={setType}
              options={types.map((value) => ({
                value,
                label: t.dashboard.forms.types[value],
              }))}
            />
          </Field>
        </div>

        {type === "text" && (
          <div className="grid gap-3 rounded-lg bg-sunk p-3.5 sm:grid-cols-[160px_1fr]">
            <Field
              data-invalid={error === "lengthInvalid" ? true : undefined}
              className="gap-1.5"
            >
              <FieldLabel htmlFor="max_length">
                {copy.maxLength} <span className={small}>{copy.optional}</span>
              </FieldLabel>
              <Input
                id="max_length"
                name="max_length"
                type="number"
                min={1}
                max={10000}
                defaultValue={state.max_length}
                aria-invalid={error === "lengthInvalid" ? true : undefined}
              />
            </Field>
            <Field
              data-invalid={error === "patternInvalid" ? true : undefined}
              className="gap-1.5"
            >
              <FieldLabel htmlFor="pattern">
                {copy.pattern} <span className={small}>{copy.optional}</span>
              </FieldLabel>
              <Input
                id="pattern"
                name="pattern"
                className="font-mono text-[13px]"
                maxLength={500}
                spellCheck={false}
                placeholder="[0-9]{8}[A-Z]"
                defaultValue={state.pattern}
                aria-invalid={error === "patternInvalid" ? true : undefined}
              />
            </Field>
          </div>
        )}

        {listed && (
          <FieldSet className="grid gap-2 rounded-lg bg-sunk p-3.5">
            <FieldLegend variant="label" className="mb-1.5 text-sm font-medium">
              {copy.options} <span className={small}>{copy.optionsHint}</span>
            </FieldLegend>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2 text-[13px] text-muted-foreground">
              <span>{copy.optionValue}</span>
              <span>{copy.label}</span>
              <span className="w-8" />
            </div>
            {options.map((option, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-start gap-2"
              >
                <Input
                  className="font-mono text-[13px]"
                  value={option.value}
                  maxLength={100}
                  aria-label={`${copy.optionValue} ${index + 1}`}
                  onChange={(event) =>
                    setOption(index, { value: event.target.value })
                  }
                  aria-invalid={error === "optionsInvalid" ? true : undefined}
                />
                <MultilingualInput
                  id={`option-${index}`}
                  value={option.labels}
                  onChange={(labels) => setOption(index, { labels })}
                  maxLength={200}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={options.length <= 2}
                  onClick={() =>
                    setOptions((all) => all.filter((_, i) => i !== index))
                  }
                  aria-label={copy.removeOption}
                  title={copy.removeOption}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => setOptions((all) => [...all, blank()])}
            >
              <PlusIcon />
              {copy.addOption}
            </Button>
          </FieldSet>
        )}

        {type === "file" && (
          <FieldSet className="grid gap-2 rounded-lg bg-sunk p-3.5">
            <FieldLegend variant="label" className="mb-1.5 text-sm font-medium">
              {copy.formats} <span className={small}>{copy.formatsHint}</span>
            </FieldLegend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {formats.map((format) => (
                <FieldLabel
                  key={format.value}
                  className="flex cursor-pointer items-center gap-2 font-normal"
                >
                  <Checkbox
                    key={round}
                    name="formats"
                    value={format.value}
                    defaultChecked={state.formats?.includes(format.value)}
                    aria-invalid={error === "formatsInvalid" ? true : undefined}
                  />
                  {format.label}
                </FieldLabel>
              ))}
            </div>
          </FieldSet>
        )}

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard/catalogue">{copy.cancel}</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {copy.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
