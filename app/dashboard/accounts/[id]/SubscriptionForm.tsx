"use client";

import { useActionState } from "react";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useI18n } from "@/app/i18n/client";
import {
  saveSubscription,
  type SubscriptionState,
} from "@/app/lib/subscription-actions";
import { useAnswerRound } from "@/app/lib/use-answer-round";

const small = "text-[13px] text-muted-foreground font-normal";
const PLANS = ["standard"] as const;

/**
 * An account's subscription, as the trust anchor's admins set it: its status
 * — none takes it away, back to the free use —, its plan, the day it is paid
 * through (empty: open-ended) and a note only the anchor reads.
 */
export function SubscriptionForm({
  accountId,
  initial,
}: {
  accountId: string;
  initial: SubscriptionState;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.accounts;
  const billing = t.dashboard.billing;
  const [state, action, pending] = useActionState<SubscriptionState, FormData>(
    saveSubscription.bind(null, accountId),
    initial,
  );
  const round = useAnswerRound(state);
  const error = state.error;

  return (
    <form className="flex flex-col gap-[18px]" action={action} noValidate>
      <h2 className="text-lg font-semibold">{copy.subscription}</h2>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors[error]}</AlertDescription>
        </Alert>
      )}
      {state.saved && !pending && (
        <Alert variant="notice" role="status">
          <AlertDescription>{copy.saved}</AlertDescription>
        </Alert>
      )}
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="status">{copy.status}</FieldLabel>
          <Select
            key={round}
            id="status"
            name="status"
            defaultValue={state.status}
            options={[
              { value: "", label: copy.none },
              { value: "active", label: billing.statuses.active },
              { value: "past_due", label: billing.statuses.past_due },
              { value: "canceled", label: billing.statuses.canceled },
            ]}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="plan">{billing.plan}</FieldLabel>
          <Select
            key={round}
            id="plan"
            name="plan"
            defaultValue={state.plan}
            options={PLANS.map((plan) => ({
              value: plan,
              label: billing.plans[plan],
            }))}
          />
        </Field>
        <Field
          data-invalid={
            error === "untilInvalid" || error === "untilPast" ? true : undefined
          }
          className="gap-1.5"
        >
          <FieldLabel htmlFor="until" className="items-baseline">
            {copy.until} <span className={small}>{copy.optional}</span>
          </FieldLabel>
          <Input
            id="until"
            name="until"
            type="date"
            defaultValue={state.until}
            aria-invalid={
              error === "untilInvalid" || error === "untilPast"
                ? true
                : undefined
            }
          />
        </Field>
      </div>
      <FieldDescription className="-mt-2 text-[13px] text-faint">
        {copy.untilHint}
      </FieldDescription>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="note" className="items-baseline">
          {copy.note} <span className={small}>{copy.noteHint}</span>
        </FieldLabel>
        <Textarea
          id="note"
          name="note"
          rows={2}
          maxLength={1000}
          defaultValue={state.note}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {copy.save}
        </Button>
      </div>
    </form>
  );
}
