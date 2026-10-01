"use client";

import { useActionState, useState } from "react";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import { saveSigning, type SigningState } from "@/app/lib/directory-actions";

type Choice = { id: string; label: string };

/**
 * An issuer's or verifier's signing system, for admins. The catalogue so far
 * has one system, one specific user, whose signer is chosen among the
 * tenant's members; choosing none takes the configuration away.
 */
export function SigningForm({
  section,
  id,
  system,
  signer,
  members,
}: {
  section: "issuers" | "verifiers";
  id: string;
  system: string;
  signer: string;
  members: Choice[];
}) {
  const { t } = useI18n();
  const copy = t.dashboard.signing;
  const [state, action, pending] = useActionState<SigningState, FormData>(
    saveSigning.bind(null, section, id),
    { system, signer },
  );
  // The system chosen decides whether a signer is asked for; each answer
  // from the action sets it again, and mounts the selects anew (`round`).
  const round = useAnswerRound(state);
  const [chosen, setChosen] = useState(state.system);
  const [answered, setAnswered] = useState(state);
  if (answered !== state) {
    setAnswered(state);
    setChosen(state.system);
  }
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

        <Field className="gap-1.5">
          <FieldLabel htmlFor="system">{copy.system}</FieldLabel>
          <Select
            key={round}
            id="system"
            name="system"
            defaultValue={state.system}
            onChange={setChosen}
            options={[
              { value: "", label: copy.notConfigured },
              { value: "single_user", label: copy.single_user },
            ]}
          />
        </Field>

        {chosen === "single_user" && (
          <Field
            data-invalid={errors.signer ? true : undefined}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="signer">{copy.signer}</FieldLabel>
            <Select
              key={round}
              id="signer"
              name="signer"
              defaultValue={state.signer}
              aria-invalid={errors.signer ? true : undefined}
              aria-describedby={errors.signer ? "signer-error" : undefined}
              options={[
                { value: "", label: copy.chooseSigner },
                ...members.map((member) => ({
                  value: member.id,
                  label: member.label,
                })),
              ]}
            />
            {errors.signer && (
              <FieldError className="text-[13px]" id="signer-error">
                {copy.errors[errors.signer]}
              </FieldError>
            )}
          </Field>
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {copy.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
