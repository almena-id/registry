"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import {
  renameIdentity,
  type IdentityState,
} from "@/app/lib/directory-actions";

/**
 * An identity's name, which any member changes: its DID stays, and the
 * tenant, issuer, verifier or mediator acting as it keeps its own name.
 */
export function IdentityForm({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<IdentityState, FormData>(
    renameIdentity.bind(null, id),
    { name },
  );
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
            <AlertDescription>{t.dashboard.identity.saved}</AlertDescription>
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
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {t.dashboard.identity.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
