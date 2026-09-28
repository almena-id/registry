"use client";

import Link from "next/link";
import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import { createItem, type CreateState } from "@/app/lib/directory-actions";
import type { Item, Section } from "@/app/lib/directory-types";

/**
 * Issuers and verifiers are `described` and pick one of the tenant's
 * `mediators`; mediators have an address. Each gets an identity of its own,
 * named like it, which the API creates.
 */
export function CreateForm({
  section,
  described,
  mediators,
}: {
  section: Section;
  described: boolean;
  mediators: Item[] | null;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createItem.bind(null, section),
    {},
  );
  const round = useAnswerRound(state);
  const errors = state.errors ?? {};
  const error = (key?: keyof typeof copy.errors) =>
    key ? copy.errors[key] : null;

  return (
    <form className="card form" action={action} noValidate>
      {errors.form && (
        <p className="alert" role="alert">
          {error(errors.form)}
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
          autoFocus
          required
          defaultValue={state.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p className="field__error" id="name-error">
            {error(errors.name)}
          </p>
        )}
      </div>

      {described && (
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
              {error(errors.description)}
            </p>
          )}
        </div>
      )}

      {section === "mediators" && (
        <div className="field">
          <label className="field__label" htmlFor="url">
            {copy.url}
          </label>
          <input
            className="field__input"
            id="url"
            name="url"
            inputMode="url"
            maxLength={2048}
            required
            placeholder="https://mediator.example.org"
            defaultValue={state.url}
            aria-invalid={errors.url ? true : undefined}
            aria-describedby={errors.url ? "url-error" : "url-hint"}
          />
          {errors.url ? (
            <p className="field__error" id="url-error">
              {error(errors.url)}
            </p>
          ) : (
            <p className="field__hint" id="url-hint">
              {copy.urlHint}
            </p>
          )}
        </div>
      )}

      {mediators && (
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
            {mediators.map((mediator) => (
              <option key={mediator.id} value={mediator.id}>
                {mediator.name}
              </option>
            ))}
          </select>
          {errors.mediator && (
            <p className="field__error" id="mediator-error">
              {error(errors.mediator)}
            </p>
          )}
        </div>
      )}

      <div className="form__actions">
        <Link className="button button--ghost" href={`/dashboard/${section}`}>
          {copy.cancel}
        </Link>
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
