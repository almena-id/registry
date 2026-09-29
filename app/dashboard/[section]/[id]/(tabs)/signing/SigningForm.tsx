"use client";

import { useActionState, useState } from "react";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
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
    <Card className="max-w-[720px] gap-0 p-6">
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

        <div className="grid gap-1.5">
          <Label htmlFor="system">{copy.system}</Label>
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
        </div>

        {chosen === "single_user" && (
          <div className="grid gap-1.5">
            <Label htmlFor="signer">{copy.signer}</Label>
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
              <p className="text-[13px] text-destructive" id="signer-error">
                {copy.errors[errors.signer]}
              </p>
            )}
          </div>
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
