"use client";

import { useActionState, useState } from "react";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import type { SigningFlow } from "@/app/lib/signing-flows";
import { signingFlows } from "@/app/lib/signing-flows";
import {
  saveSigningFlow,
  type SigningFlowState,
} from "@/app/lib/tenant-actions";
import { FlowExplained } from "./FlowExplained";

/** A card's look on a <section>: a region of its own, with its heading. */
const PART =
  "rounded-2xl border bg-card px-6 py-5 text-card-foreground shadow-card";

type Choice = { id: string; label: string };

/**
 * The tab's two halves. Left, the configuration: the flow and, below it,
 * what that flow asks for — `any_admin` nothing, `single_user` the member
 * who signs. Right, how the flow in the select works, redrawn as it changes,
 * to weigh one before saving it. Nothing is saved until "Save".
 */
export function SigningFlowForm({
  signingFlow,
  signer,
  signerWithoutWallet,
  members,
  editable,
}: {
  signingFlow: SigningFlow;
  signer: string;
  signerWithoutWallet: boolean;
  /** The tenant's members, to name the one who signs under `single_user`. */
  members: Choice[];
  editable: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.tenant;
  const [state, action, pending] = useActionState<SigningFlowState, FormData>(
    saveSigningFlow,
    { signingFlow, signer },
  );
  const round = useAnswerRound(state);
  const [chosen, setChosen] = useState<SigningFlow>(state.signingFlow);
  const [answered, setAnswered] = useState(state);
  if (answered !== state) {
    setAnswered(state);
    setChosen(state.signingFlow);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className={PART}>
        <h2 className="mb-4 text-[15px] font-semibold">
          {copy.signing.settings}
        </h2>
        <form className="flex flex-col gap-[18px]" action={action} noValidate>
          {!editable && (
            <Alert variant="notice" role="status">
              <AlertDescription>{copy.readOnly}</AlertDescription>
            </Alert>
          )}
          {state.error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{copy.errors[state.error]}</AlertDescription>
            </Alert>
          )}
          {state.saved && !pending && (
            <Alert variant="notice" role="status">
              <AlertDescription>{copy.saved}</AlertDescription>
            </Alert>
          )}

          <Field className="gap-1.5">
            <FieldLabel htmlFor="signingFlow">{copy.signingFlow}</FieldLabel>
            <Select
              key={round}
              id="signingFlow"
              name="signingFlow"
              disabled={!editable}
              defaultValue={state.signingFlow}
              onChange={(value) => setChosen(value as SigningFlow)}
              options={signingFlows.map((value) => ({
                value,
                label: copy.signingFlows[value].label,
              }))}
            />
          </Field>

          {/* What the chosen flow asks for. */}
          <div className="border-t pt-4">
            {chosen === "single_user" ? (
              <Field
                data-invalid={state.signerError ? true : undefined}
                className="gap-1.5"
              >
                <FieldLabel htmlFor="signer">
                  {t.dashboard.signing.signer}
                </FieldLabel>
                <Select
                  key={round}
                  id="signer"
                  name="signer"
                  disabled={!editable}
                  defaultValue={state.signer}
                  aria-invalid={state.signerError ? true : undefined}
                  aria-describedby={
                    state.signerError ? "signer-error" : undefined
                  }
                  options={[
                    { value: "", label: t.dashboard.signing.chooseSigner },
                    ...members.map((member) => ({
                      value: member.id,
                      label: member.label,
                    })),
                  ]}
                />
                {state.signerError && (
                  <FieldError className="text-[13px]" id="signer-error">
                    {copy.errors[state.signerError]}
                  </FieldError>
                )}
                {signerWithoutWallet && state.signer === signer && (
                  <p className="text-[13px] text-faint">
                    {copy.signing.signerWithoutWallet}
                  </p>
                )}
              </Field>
            ) : (
              <p className="text-sm text-muted-foreground">
                {copy.signing.nothingToSet}
              </p>
            )}
          </div>

          {editable && (
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={pending}>
                {copy.save}
              </Button>
            </div>
          )}
        </form>
      </section>

      <section className={PART} aria-labelledby="flows-title">
        <h2 id="flows-title" className="mb-4 text-[15px] font-semibold">
          {copy.signing.howItWorks}
        </h2>
        <FlowExplained flow={chosen} saved={state.signingFlow} />
      </section>
    </div>
  );
}
