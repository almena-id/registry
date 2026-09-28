"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { saveMediator, type MediatorState } from "@/app/lib/directory-actions";

/** A mediator's name and address; any member of the tenant may change them. */
export function MediatorForm({
  id,
  name,
  url,
}: {
  id: string;
  name: string;
  url: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<MediatorState, FormData>(
    saveMediator.bind(null, id),
    { name, url },
  );
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
          {t.dashboard.mediator.saved}
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
          defaultValue={state.url}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? "url-error" : "url-hint"}
        />
        {errors.url ? (
          <p className="field__error" id="url-error">
            {copy.errors[errors.url]}
          </p>
        ) : (
          <p className="field__hint" id="url-hint">
            {copy.urlHint}
          </p>
        )}
      </div>

      <div className="form__actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={pending}
        >
          {t.dashboard.mediator.save}
        </button>
      </div>
    </form>
  );
}
