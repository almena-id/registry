"use client";

import { useActionState } from "react";

import { Select } from "@/app/components/Select";
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
import { useAnswerRound } from "@/app/lib/use-answer-round";
import {
  mediatorOptions,
  type MediatorChoice,
} from "@/app/lib/directory-types";
import { saveTenant, type TenantState } from "@/app/lib/tenant-actions";

/** Admins edit; members see the same fields, read-only. */
export function TenantForm({
  name,
  mediator,
  mediators,
  identity,
  editable,
}: {
  name: string;
  /** The chosen mediator's id; empty for none. */
  mediator: string;
  /** The mediators it may pick (its own, or public ones) for its own identity. */
  mediators: MediatorChoice[];
  /** The tenant's own identity; renamed with the tenant by the API. */
  identity: string | null;
  editable: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.tenant;
  const [state, action, pending] = useActionState<TenantState, FormData>(
    saveTenant,
    { name, mediator },
  );
  const round = useAnswerRound(state);
  const errors = state.errors ?? {};

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        {!editable && (
          <Alert variant="notice" role="status">
            <AlertDescription>{copy.readOnly}</AlertDescription>
          </Alert>
        )}
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
          data-invalid={errors.name ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="name">{copy.name}</FieldLabel>
          <Input
            className={
              editable
                ? undefined
                : "border-dashed bg-transparent text-muted-foreground"
            }
            id="name"
            name="name"
            maxLength={200}
            required
            readOnly={!editable}
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
          data-invalid={errors.mediator ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="mediator">{copy.mediator}</FieldLabel>
          <Select
            key={round}
            id="mediator"
            name="mediator"
            disabled={!editable}
            defaultValue={state.mediator}
            aria-invalid={errors.mediator ? true : undefined}
            aria-describedby={
              errors.mediator ? "mediator-error" : "mediator-hint"
            }
            options={[
              {
                value: "",
                label: mediators.length
                  ? t.dashboard.items.noMediator
                  : copy.noMediators,
              },
              ...mediatorOptions(mediators, t.dashboard.items.publicMediator),
            ]}
          />
          {errors.mediator ? (
            <FieldError className="text-[13px]" id="mediator-error">
              {copy.errors[errors.mediator]}
            </FieldError>
          ) : (
            <FieldDescription
              className="text-[13px] text-faint"
              id="mediator-hint"
            >
              {copy.mediatorHint}
            </FieldDescription>
          )}
        </Field>

        <dl className="grid gap-3">
          <div className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm">
            <dt className="text-muted-foreground" title={copy.identityHint}>
              {copy.identity}
            </dt>
            <dd>{identity ?? "—"}</dd>
          </div>
        </dl>

        {editable && (
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>
              {copy.save}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
