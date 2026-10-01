"use client";

import { useActionState } from "react";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import {
  saveDescribed,
  type DescribedState,
} from "@/app/lib/directory-actions";
import {
  mediatorOptions,
  type MediatorChoice,
} from "@/app/lib/directory-types";

/**
 * An issuer's or verifier's name, description and mediator; any member of the
 * tenant may change them. Its DID stays whatever they become.
 */
export function DescribedForm({
  section,
  id,
  name,
  description,
  mediator,
  mediators,
}: {
  section: "issuers" | "verifiers";
  id: string;
  name: string;
  description: string;
  mediator: string;
  mediators: MediatorChoice[];
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const own = section === "issuers" ? t.dashboard.issuer : t.dashboard.verifier;
  const [state, action, pending] = useActionState<DescribedState, FormData>(
    saveDescribed.bind(null, section, id),
    { name, description, mediator },
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
            <AlertDescription>{own.saved}</AlertDescription>
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

        <Field
          data-invalid={errors.description ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="description">
            {copy.description}{" "}
            <span className="font-normal text-faint">{copy.optional}</span>
          </FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={state.description}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
          />
          {errors.description && (
            <FieldError className="text-[13px]" id="description-error">
              {copy.errors[errors.description]}
            </FieldError>
          )}
        </Field>

        <Field
          data-invalid={errors.mediator ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="mediator">
            {copy.mediator}{" "}
            <span className="font-normal text-faint">{copy.optional}</span>
          </FieldLabel>
          <Select
            key={round}
            id="mediator"
            name="mediator"
            defaultValue={state.mediator ?? ""}
            aria-invalid={errors.mediator ? true : undefined}
            aria-describedby={errors.mediator ? "mediator-error" : undefined}
            options={[
              { value: "", label: copy.noMediator },
              ...mediatorOptions(mediators, copy.publicMediator),
            ]}
          />
          {errors.mediator && (
            <FieldError className="text-[13px]" id="mediator-error">
              {copy.errors[errors.mediator]}
            </FieldError>
          )}
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {own.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
