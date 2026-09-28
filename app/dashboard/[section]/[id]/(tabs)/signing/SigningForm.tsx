"use client";

import { useActionState, useState } from "react";

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
    <form className="card form form--wide" action={action} noValidate>
      {errors.form && (
        <p className="alert" role="alert">
          {copy.errors[errors.form]}
        </p>
      )}
      {state.saved && !pending && (
        <p className="notice" role="status">
          {copy.saved}
        </p>
      )}

      <div className="field">
        <label className="field__label" htmlFor="system">
          {copy.system}
        </label>
        <select
          key={round}
          className="field__input"
          id="system"
          name="system"
          defaultValue={state.system}
          onChange={(event) => setChosen(event.target.value)}
        >
          <option value="">{copy.notConfigured}</option>
          <option value="single_user">{copy.single_user}</option>
        </select>
      </div>

      {chosen === "single_user" && (
        <div className="field">
          <label className="field__label" htmlFor="signer">
            {copy.signer}
          </label>
          <select
            key={round}
            className="field__input"
            id="signer"
            name="signer"
            defaultValue={state.signer}
            aria-invalid={errors.signer ? true : undefined}
            aria-describedby={errors.signer ? "signer-error" : undefined}
          >
            <option value="">{copy.chooseSigner}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
          {errors.signer && (
            <p className="field__error" id="signer-error">
              {copy.errors[errors.signer]}
            </p>
          )}
        </div>
      )}

      <div className="form__actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={pending}
        >
          {copy.save}
        </button>
      </div>
    </form>
  );
}
