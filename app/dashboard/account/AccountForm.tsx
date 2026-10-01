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
import { saveAccount, type AccountState } from "@/app/lib/account-actions";

export function AccountForm({ alias }: { alias: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.account;
  const [state, action, pending] = useActionState<AccountState, FormData>(
    saveAccount,
    {
      alias,
    },
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
            <AlertDescription>{copy.saved}</AlertDescription>
          </Alert>
        )}

        <Field
          data-invalid={errors.alias ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="alias">{copy.alias}</FieldLabel>
          <Input
            id="alias"
            name="alias"
            maxLength={100}
            autoComplete="nickname"
            defaultValue={state.alias}
            aria-invalid={errors.alias ? true : undefined}
            aria-describedby={errors.alias ? "alias-error" : "alias-hint"}
          />
          {errors.alias ? (
            <FieldError className="text-[13px]" id="alias-error">
              {copy.errors[errors.alias]}
            </FieldError>
          ) : (
            <FieldDescription
              className="text-[13px] text-faint"
              id="alias-hint"
            >
              {copy.aliasHint}
            </FieldDescription>
          )}
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {copy.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
