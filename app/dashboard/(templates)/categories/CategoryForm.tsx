"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { MultilingualInput } from "@/app/components/MultilingualInput";
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
  CATEGORY_ICONS,
  categoryIconNames,
  type CategoryIconName,
} from "@/app/lib/category-icons";
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
 * credential types): its key, its name in every language and the icon it is
 * drawn with, picked from the API's. With `edit`, an existing one: its name
 * and icon change.
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
  const [icon, setIcon] = useState<string>(state.icon ?? "tag");
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
        <FieldSet
          className="gap-2"
          data-invalid={error === "iconInvalid" ? true : undefined}
        >
          <FieldLegend variant="label">{copy.icon}</FieldLegend>
          <input type="hidden" name="icon" value={icon} />
          <div
            role="radiogroup"
            aria-label={copy.icon}
            className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5 sm:max-w-[520px]"
          >
            {categoryIconNames.map((name: CategoryIconName) => {
              const Icon = CATEGORY_ICONS[name];
              const chosen = icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  aria-label={copy.icons[name]}
                  title={copy.icons[name]}
                  onClick={() => setIcon(name)}
                  className="grid aspect-square place-items-center rounded-[10px] border bg-card text-muted-foreground transition-colors outline-none hover:border-input hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-checked:border-primary aria-checked:bg-brand-soft aria-checked:text-primary"
                >
                  <Icon className="size-5" aria-hidden />
                </button>
              );
            })}
          </div>
          <FieldDescription className="text-[13px] text-faint">
            {copy.iconHint}
          </FieldDescription>
        </FieldSet>
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
