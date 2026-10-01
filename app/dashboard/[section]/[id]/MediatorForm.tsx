"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { saveMediator, type MediatorState } from "@/app/lib/directory-actions";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import { PublicField } from "./PublicField";

/**
 * A mediator's name, address and whether it is public; any member of the
 * tenant may change them.
 */
export function MediatorForm({
  id,
  name,
  url,
  isPublic,
}: {
  id: string;
  name: string;
  url: string;
  isPublic: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<MediatorState, FormData>(
    saveMediator.bind(null, id),
    { name, url, public: isPublic },
  );
  const round = useAnswerRound(state);
  const errors = state.errors ?? {};

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        {errors.form && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors[errors.form]}</AlertDescription>
          </Alert>
        )}
        {state.saved && !pending && (
          <Alert variant="notice" role="status">
            <AlertDescription>{t.dashboard.mediator.saved}</AlertDescription>
          </Alert>
        )}

        <Field
          data-invalid={errors.name ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="name">{copy.name}</FieldLabel>
          <Input
            id="name"
            name="name"
            maxLength={200}
            required
            defaultValue={state.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <FieldError className="text-[13px]" id="name-error">
              {copy.errors[errors.name]}
            </FieldError>
          )}
        </Field>

        <Field data-invalid={errors.url ? true : undefined} className="gap-1.5">
          <FieldLabel htmlFor="url">{copy.url}</FieldLabel>
          <Input
            id="url"
            name="url"
            inputMode="url"
            maxLength={2048}
            required
            defaultValue={state.url}
            aria-invalid={errors.url ? true : undefined}
            aria-describedby={errors.url ? "url-error" : "url-hint"}
          />
          {errors.url ? (
            <FieldError className="text-[13px]" id="url-error">
              {copy.errors[errors.url]}
            </FieldError>
          ) : (
            <FieldDescription className="text-[13px] text-faint" id="url-hint">
              {copy.urlHint}
            </FieldDescription>
          )}
        </Field>

        <PublicField key={round} defaultChecked={state.public ?? false} />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {t.dashboard.mediator.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
