"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Select } from "@/app/components/Select";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useI18n } from "@/app/i18n/client";
import type { PartDraft } from "@/app/lib/custom-field-actions";

/** What a part may be: anything but files and groups. */
const PART_TYPES = ["text", "email", "phone", "date", "code", "codes"] as const;

const small = "text-[13px] text-muted-foreground font-normal";

let handles = 0;
/** A handle for a part, so it keeps its controls as parts move. */
export const handle = () => `part-${(handles += 1)}`;

export const blankPart = (): PartDraft => ({
  uid: handle(),
  key: "",
  required: true,
  type: "text",
  labels: {},
});

/**
 * A group's parts, in order: each a key in the group, whether it is always
 * answered, its type, its label in every language and what its type needs —
 * a length for text, the value list a list draws on. Moved up and down,
 * added and removed. While the group is in use, the API keeps every part it
 * had and takes new ones only as optional.
 */
export function PartsEditor({
  parts,
  onChange,
  lists,
  invalid,
}: {
  parts: PartDraft[];
  onChange: (parts: PartDraft[]) => void;
  lists: { value: string; label: string }[];
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;
  const set = (index: number, patch: Partial<PartDraft>) =>
    onChange(
      parts.map((part, i) => (i === index ? { ...part, ...patch } : part)),
    );
  const move = (index: number, by: number) => {
    const next = [...parts];
    const [part] = next.splice(index, 1);
    next.splice(index + by, 0, part);
    onChange(next);
  };

  return (
    <FieldSet
      data-invalid={invalid}
      className="grid gap-3 rounded-lg bg-sunk p-3.5"
    >
      <FieldLegend
        variant="label"
        className="mb-1.5 flex items-baseline gap-2 text-sm font-medium"
      >
        {copy.parts} <span className={small}>{copy.partsHint}</span>
      </FieldLegend>
      {parts.map((part, index) => {
        const id = (name: string) => `part-${index}-${name}`;
        const listed = part.type === "code" || part.type === "codes";
        return (
          <div
            key={part.uid ?? index}
            className="grid gap-3 rounded-lg border bg-card p-3"
          >
            <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
              <Field className="gap-1.5">
                <FieldLabel htmlFor={id("key")}>{copy.key}</FieldLabel>
                <Input
                  id={id("key")}
                  className="font-mono text-[13px]"
                  maxLength={64}
                  spellCheck={false}
                  autoCapitalize="off"
                  value={part.key}
                  onChange={(event) => set(index, { key: event.target.value })}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={id("type")}>{copy.type}</FieldLabel>
                <Select
                  id={id("type")}
                  name={id("type")}
                  defaultValue={part.type}
                  onChange={(type) => set(index, { type })}
                  options={PART_TYPES.map((value) => ({
                    value,
                    label: t.dashboard.forms.types[value],
                  }))}
                />
              </Field>
              <FieldLabel className="flex h-9 cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={part.required}
                  onCheckedChange={(checked) =>
                    set(index, { required: checked === true })
                  }
                />
                {copy.mandatory}
              </FieldLabel>
              <div className="flex h-9 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={copy.moveUp}
                  title={copy.moveUp}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === parts.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={copy.moveDown}
                  title={copy.moveDown}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={parts.length <= 1}
                  onClick={() => onChange(parts.filter((_, i) => i !== index))}
                  aria-label={copy.removePart}
                  title={copy.removePart}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor={id("labels")}>{copy.label}</FieldLabel>
              <MultilingualInput
                id={id("labels")}
                value={part.labels}
                onChange={(labels) => set(index, { labels })}
                maxLength={200}
                label={`${copy.label} ${index + 1}`}
              />
            </Field>
            {part.type === "text" && (
              <Field className="gap-1.5 sm:max-w-[200px]">
                <FieldLabel htmlFor={id("length")} className="items-baseline">
                  {copy.maxLength}{" "}
                  <span className={small}>{copy.optional}</span>
                </FieldLabel>
                <Input
                  id={id("length")}
                  type="number"
                  min={1}
                  max={10000}
                  value={part.max_length ?? ""}
                  onChange={(event) =>
                    set(index, { max_length: event.target.value })
                  }
                />
              </Field>
            )}
            {listed && (
              <Field className="gap-1.5">
                <FieldLabel htmlFor={id("domain")}>
                  {copy.valuesFrom}
                </FieldLabel>
                <Select
                  id={id("domain")}
                  name={id("domain")}
                  defaultValue={part.domain ?? ""}
                  onChange={(domain) => set(index, { domain })}
                  options={[{ value: "", label: copy.choose }, ...lists]}
                />
              </Field>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => onChange([...parts, blankPart()])}
      >
        <PlusIcon />
        {copy.addPart}
      </Button>
    </FieldSet>
  );
}
