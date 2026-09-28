"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { useI18n } from "@/app/i18n/client";
import { createItem, type CreateState } from "@/app/lib/directory-actions";
import type { IdentityRef, Section } from "@/app/lib/directory-types";

/**
 * Issuers and verifiers are `described`, and act as an identity: a new one
 * named like them, or one the tenant already has.
 */
export function CreateForm({
  section,
  described,
  identities,
}: {
  section: Section;
  described: boolean;
  identities: IdentityRef[];
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createItem.bind(null, section),
    {},
  );
  const errors = state.errors ?? {};
  const [mode, setMode] = useState<"new" | "existing">(
    state.identityMode ?? "new",
  );
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

      {described && (
        <fieldset className="field">
          <legend className="field__label">{copy.identity}</legend>
          <p className="field__hint">{copy.identityHint}</p>
          <div className="choices">
            <label className="choice">
              <input
                type="radio"
                name="identity_mode"
                value="new"
                checked={mode === "new"}
                onChange={() => setMode("new")}
              />
              <span className="choice__text">
                <span className="choice__title">{copy.identityNew}</span>
                <span className="choice__hint">{copy.identityNewHint}</span>
              </span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="identity_mode"
                value="existing"
                checked={mode === "existing"}
                disabled={identities.length === 0}
                onChange={() => setMode("existing")}
              />
              <span className="choice__text">
                <span className="choice__title">{copy.identityExisting}</span>
                <span className="choice__hint">
                  {identities.length
                    ? copy.identityExistingHint
                    : copy.noIdentities}
                </span>
              </span>
            </label>
          </div>
          {mode === "existing" && (
            <select
              className="field__input field__select"
              name="identity_id"
              aria-label={copy.identityPick}
              defaultValue={state.identityId ?? ""}
              aria-invalid={errors.identity ? true : undefined}
              aria-describedby={errors.identity ? "identity-error" : undefined}
            >
              <option value="" disabled>
                {copy.identityPick}
              </option>
              {identities.map((identity) => (
                <option key={identity.id} value={identity.id}>
                  {identity.name}
                </option>
              ))}
            </select>
          )}
          {errors.identity && (
            <p className="field__error" id="identity-error">
              {error(errors.identity)}
            </p>
          )}
        </fieldset>
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
