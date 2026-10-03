"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { Verdict } from "@/app/components/Verdict";
import { useI18n } from "@/app/i18n/client";
import { verifyPresentation, type VerifyState } from "@/app/lib/verify-actions";

/**
 * What a wallet answered a verifier with for this form — the `vp_token`, and
 * the nonce and audience its key binding must carry — and, once checked, the
 * verdict credential by credential: verified or not, its issuer and format,
 * the claims disclosed and the fields they fill, or what went wrong.
 */
export function VerifyForm({ formId }: { formId: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.forms.detail;
  const [state, action, pending] = useActionState<VerifyState, FormData>(
    verifyPresentation.bind(null, formId),
    {},
  );
  const errors = state.errors ?? {};
  const result = state.result;

  return (
    <div className="grid gap-4">
      <Card className="gap-0 p-6">
        <form className="flex flex-col gap-[18px]" action={action} noValidate>
          <p className="text-sm text-muted-foreground">{copy.verifyLead}</p>
          {errors.form && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{copy.errors[errors.form]}</AlertDescription>
            </Alert>
          )}
          <Field
            data-invalid={errors.vpToken ? true : undefined}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="vp_token">{copy.vpToken}</FieldLabel>
            <Textarea
              id="vp_token"
              name="vp_token"
              rows={6}
              spellCheck={false}
              className="font-mono text-[13px]"
              placeholder='{"query_id": ["eyJ…~…~eyJ…"]}'
              defaultValue={state.vpToken}
              aria-invalid={errors.vpToken ? true : undefined}
            />
            {errors.vpToken ? (
              <FieldError className="text-[13px]">
                {copy.errors[errors.vpToken]}
              </FieldError>
            ) : (
              <FieldDescription className="text-[13px] text-faint">
                {copy.vpTokenHint}
              </FieldDescription>
            )}
          </Field>
          <div className="grid gap-[18px] sm:grid-cols-2">
            <Field
              data-invalid={errors.nonce ? true : undefined}
              className="gap-1.5"
            >
              <FieldLabel htmlFor="nonce">{copy.nonce}</FieldLabel>
              <Input
                id="nonce"
                name="nonce"
                maxLength={200}
                className="font-mono"
                defaultValue={state.nonce}
                aria-invalid={errors.nonce ? true : undefined}
              />
              {errors.nonce && (
                <FieldError className="text-[13px]">
                  {copy.errors[errors.nonce]}
                </FieldError>
              )}
            </Field>
            <Field
              data-invalid={errors.audience ? true : undefined}
              className="gap-1.5"
            >
              <FieldLabel htmlFor="audience">{copy.audience}</FieldLabel>
              <Input
                id="audience"
                name="audience"
                maxLength={500}
                className="font-mono"
                placeholder="https://verifier.example.org"
                defaultValue={state.audience}
                aria-invalid={errors.audience ? true : undefined}
              />
              {errors.audience && (
                <FieldError className="text-[13px]">
                  {copy.errors[errors.audience]}
                </FieldError>
              )}
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {copy.check}
            </Button>
          </div>
        </form>
      </Card>

      {result && !pending && <Verdict result={result} />}
    </div>
  );
}
