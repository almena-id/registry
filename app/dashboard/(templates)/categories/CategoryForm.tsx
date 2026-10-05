"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useI18n } from "@/app/i18n/client";
import {
  createCategory,
  updateCategory,
  type CategoryState,
} from "@/app/lib/category-actions";
import type { Texts } from "@/app/lib/texts";
import { segmentOf, type Kind } from "./kinds";

const small = "text-[13px] text-muted-foreground font-normal";

/**
 * A category of Almena's catalogue, of the kind its screen files (fields or
 * credential types): its key and its name in every language. With `edit`, an
 * existing one: only its name changes.
 */
export function CategoryForm({
  kind,
  edit,
  initial,
}: {
  kind: Kind;
  edit?: string;
  initial: CategoryState;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue.categories;
  const [state, action, pending] = useActionState<CategoryState, FormData>(
    edit ? updateCategory.bind(null, edit) : createCategory,
    initial,
  );
  const [labels, setLabels] = useState<Texts>(state.labels ?? {});
  const error = state.error;
  const keyWrong =
    error === "keyRequired" || error === "keyInvalid" || error === "keyExists"
      ? true
      : undefined;

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        <input type="hidden" name="kind" value={kind} />
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
            maxLength={100}
            autoFocus
            invalid={error === "labelsRequired"}
            describedBy="labels-hint"
          />
          <FieldDescription className="text-[13px] text-faint" id="labels-hint">
            {t.dashboard.catalogue.labelsEveryHint}
          </FieldDescription>
        </Field>
        <div className="grid items-end gap-3 sm:grid-cols-2">
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
              maxLength={32}
              spellCheck={false}
              autoCapitalize="off"
              defaultValue={state.key}
              disabled={Boolean(edit)}
              aria-invalid={keyWrong}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href={`/dashboard/categories/${segmentOf(kind)}`}>
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
