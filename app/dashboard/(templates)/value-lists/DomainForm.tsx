"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
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
  createDomain,
  updateDomain,
  type CodeDraft,
  type DomainState,
} from "@/app/lib/value-domain-actions";
import type { Texts } from "@/app/lib/texts";
import { useAnswerRound } from "@/app/lib/use-answer-round";

const small = "text-[13px] text-muted-foreground font-normal";
const blank = (): CodeDraft => ({ value: "", labels: {} });

/**
 * A value list of Almena's catalogue: its name in every language, its key,
 * where it comes from, what its values are (texts or whole numbers) and its
 * codes in order — each a value, its name in every language and, for file
 * formats, its media type. Long lists are found by a filter. With `edit`, an
 * existing one, its key and kind fixed; while a field draws on it the API
 * keeps every code it had.
 */
export function DomainForm({
  edit,
  initial,
}: {
  edit?: string;
  initial: DomainState;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.catalogue.domains;
  const [state, action, pending] = useActionState<DomainState, FormData>(
    edit ? updateDomain.bind(null, edit) : createDomain,
    initial,
  );
  const round = useAnswerRound(state);
  const [labels, setLabels] = useState<Texts>(state.labels ?? {});
  const [key, setKey] = useState(state.key ?? "");
  const [codes, setCodes] = useState<CodeDraft[]>(
    state.codes?.length ? state.codes : [blank()],
  );
  const [filter, setFilter] = useState("");
  const error = state.error;
  const files = key === "file_format";
  const keyWrong =
    error === "keyRequired" || error === "keyInvalid" || error === "keyExists"
      ? true
      : undefined;

  const setCode = (index: number, patch: Partial<CodeDraft>) =>
    setCodes((all) =>
      all.map((code, i) => (i === index ? { ...code, ...patch } : code)),
    );
  // The rows shown: all, or those the filter finds by value or name.
  const shown = useMemo(() => {
    const text = filter.trim().toLowerCase();
    return codes
      .map((code, index) => ({ code, index }))
      .filter(
        ({ code }) =>
          !text ||
          code.value.toLowerCase().includes(text) ||
          Object.values(code.labels).some((name) =>
            name?.toLowerCase().includes(text),
          ),
      );
  }, [codes, filter]);
  // Value, its name (in the visitor's language, the globe opening the
  // others), a file format's media type, remove.
  const columns = files
    ? "minmax(0,1fr) minmax(0,3fr) minmax(0,2fr) auto"
    : "minmax(0,1fr) minmax(0,4fr) auto";

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        <input type="hidden" name="codes" value={JSON.stringify(codes)} />
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors[error]}</AlertDescription>
          </Alert>
        )}
        <Field className="gap-1.5">
          <FieldLabel htmlFor="labels">{copy.name}</FieldLabel>
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
            {t.dashboard.catalogue.labelsEveryHint}
          </FieldDescription>
        </Field>

        <div className="grid items-end gap-3 sm:grid-cols-3">
          <Field data-invalid={keyWrong} className="gap-1.5">
            <FieldLabel htmlFor="key" className="items-baseline">
              {t.dashboard.catalogue.key}{" "}
              <span className={small}>
                {edit ? t.dashboard.catalogue.keyFixed : copy.keyHint}
              </span>
            </FieldLabel>
            <Input
              id="key"
              name="key"
              className="font-mono text-[13px]"
              maxLength={64}
              spellCheck={false}
              autoCapitalize="off"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              disabled={Boolean(edit)}
              aria-invalid={keyWrong}
            />
          </Field>
          <Field
            data-invalid={error === "sourceRequired" ? true : undefined}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="source" className="items-baseline">
              {copy.source} <span className={small}>{copy.sourceHint}</span>
            </FieldLabel>
            <Input
              id="source"
              name="source"
              maxLength={200}
              placeholder="ISO 3166-1 alpha-2"
              defaultValue={state.source}
              aria-invalid={error === "sourceRequired" ? true : undefined}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="kind">{copy.kind}</FieldLabel>
            <Select
              key={round}
              id="kind"
              name="kind"
              defaultValue={state.kind || "text"}
              disabled={Boolean(edit)}
              options={[
                { value: "text", label: copy.kinds.text },
                { value: "number", label: copy.kinds.number },
              ]}
            />
          </Field>
        </div>

        <FieldSet
          data-invalid={
            error === "codesInvalid" ||
            error === "numbersInvalid" ||
            error === "mediaTypeInvalid" ||
            error === "inUse"
              ? true
              : undefined
          }
          className="grid gap-2 rounded-lg bg-sunk p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLegend
              variant="label"
              className="flex items-baseline gap-2 text-sm font-medium"
            >
              {copy.codes}{" "}
              <span className={small}>
                {copy.codesHint.replace("{count}", String(codes.length))}
              </span>
            </FieldLegend>
            {codes.length > 10 && (
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={copy.filter}
                aria-label={copy.filter}
                className="h-8 max-w-56 text-[13px]"
              />
            )}
          </div>
          <div
            className="grid gap-2 text-[13px] text-muted-foreground"
            style={{ gridTemplateColumns: columns }}
          >
            <span>{copy.value}</span>
            <span>{copy.name}</span>
            {files && <span>{copy.mediaType}</span>}
            <span className="w-8" />
          </div>
          <div className="grid max-h-[28rem] gap-2 overflow-y-auto">
            {shown.map(({ code, index }) => (
              <div
                key={index}
                className="grid items-start gap-2"
                style={{ gridTemplateColumns: columns }}
              >
                <Input
                  className="font-mono text-[13px]"
                  value={code.value}
                  maxLength={100}
                  aria-label={`${copy.value} ${index + 1}`}
                  onChange={(event) =>
                    setCode(index, { value: event.target.value })
                  }
                />
                <MultilingualInput
                  id={`code-${index}`}
                  value={code.labels}
                  onChange={(labels) => setCode(index, { labels })}
                  maxLength={200}
                  label={`${copy.name} ${index + 1}`}
                />
                {files && (
                  <Input
                    className="font-mono text-[13px]"
                    value={code.media_type ?? ""}
                    maxLength={100}
                    placeholder="application/pdf"
                    aria-label={`${copy.mediaType} ${index + 1}`}
                    onChange={(event) =>
                      setCode(index, { media_type: event.target.value })
                    }
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={codes.length <= 1}
                  onClick={() =>
                    setCodes((all) => all.filter((_, i) => i !== index))
                  }
                  aria-label={copy.removeCode}
                  title={copy.removeCode}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={() => {
              setFilter("");
              setCodes((all) => [...all, blank()]);
            }}
          >
            <PlusIcon />
            {copy.addCode}
          </Button>
          <p className="text-[13px] text-faint" lang={locale}>
            {edit ? copy.inUseHint : copy.newCodesHint}
          </p>
        </FieldSet>

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard/value-lists">
              {t.dashboard.catalogue.cancel}
            </Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {edit
              ? t.dashboard.catalogue.saveChanges
              : t.dashboard.catalogue.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
