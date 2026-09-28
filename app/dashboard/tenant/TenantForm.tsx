"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { saveTenant, type TenantState } from "@/app/lib/tenant-actions";

/** Admins edit; members see the same fields, read-only. */
export function TenantForm({
  name,
  mediator,
  did,
  identity,
  editable,
}: {
  name: string;
  mediator: string;
  did: string | null;
  /** The tenant's own identity; renamed with the tenant by the API. */
  identity: string | null;
  editable: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.tenant;
  const [state, action, pending] = useActionState<TenantState, FormData>(
    saveTenant,
    {
      name,
      mediator,
      did,
    },
  );
  const errors = state.errors ?? {};

  return (
    <form className="card form form--wide" action={action} noValidate>
      {!editable && (
        <p className="notice" role="status">
          {copy.readOnly}
        </p>
      )}
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
        <label className="field__label" htmlFor="name">
          {copy.name}
        </label>
        <input
          className="field__input"
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
          <p className="field__error" id="name-error">
            {copy.errors[errors.name]}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="mediator">
          {copy.mediator}
        </label>
        <input
          className="field__input"
          id="mediator"
          name="mediator"
          type="url"
          inputMode="url"
          placeholder="https://mediator.almena.network"
          readOnly={!editable}
          defaultValue={state.mediator}
          aria-invalid={errors.mediator ? true : undefined}
          aria-describedby={
            errors.mediator ? "mediator-error" : "mediator-hint"
          }
        />
        {errors.mediator ? (
          <p className="field__error" id="mediator-error">
            {copy.errors[errors.mediator]}
          </p>
        ) : (
          <p className="field__hint" id="mediator-hint">
            {copy.mediatorHint}
          </p>
        )}
      </div>

      <dl className="facts">
        <div>
          <dt title={copy.identityHint}>{copy.identity}</dt>
          <dd>{identity ?? "—"}</dd>
        </div>
        <div>
          <dt>{copy.mediatorDid}</dt>
          <dd className={state.did ? "facts__mono" : "facts__empty"}>
            {state.did ?? copy.noMediator}
          </dd>
        </div>
      </dl>

      {editable && (
        <div className="form__actions">
          <button
            className="button button--primary"
            type="submit"
            disabled={pending}
          >
            {copy.save}
          </button>
        </div>
      )}
    </form>
  );
}
