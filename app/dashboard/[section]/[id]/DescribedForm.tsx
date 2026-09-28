"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import {
  saveDescribed,
  type DescribedState,
} from "@/app/lib/directory-actions";
import type { Item } from "@/app/lib/directory-types";

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
  mediators: Item[];
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
    <form className="card form form--wide" action={action} noValidate>
      {errors.form && (
        <p className="alert" role="alert">
          {copy.errors[errors.form]}
        </p>
      )}
      {state.saved && !pending && (
        <p className="notice" role="status">
          {own.saved}
        </p>
      )}

      <div className="field">
        <label className="field__label" htmlFor="name">
          {copy.name}
        </label>
        <input
          className="field__input"
          id="name"
          name="name"
          maxLength={200}
          required
          defaultValue={state.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p className="field__error" id="name-error">
            {copy.errors[errors.name]}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="description">
          {copy.description}{" "}
          <span className="field__optional">{copy.optional}</span>
        </label>
        <textarea
          className="field__input field__input--area"
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
          <p className="field__error" id="description-error">
            {copy.errors[errors.description]}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="mediator">
          {copy.mediator}{" "}
          <span className="field__optional">{copy.optional}</span>
        </label>
        <select
          key={round}
          className="field__input"
          id="mediator"
          name="mediator"
          defaultValue={state.mediator ?? ""}
          aria-invalid={errors.mediator ? true : undefined}
          aria-describedby={errors.mediator ? "mediator-error" : undefined}
        >
          <option value="">{copy.noMediator}</option>
          {mediators.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.name}
            </option>
          ))}
        </select>
        {errors.mediator && (
          <p className="field__error" id="mediator-error">
            {copy.errors[errors.mediator]}
          </p>
        )}
      </div>

      <div className="form__actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={pending}
        >
          {own.save}
        </button>
      </div>
    </form>
  );
}
