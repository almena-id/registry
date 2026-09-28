"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import type { Item } from "@/app/lib/directory-types";
import { saveTenant, type TenantState } from "@/app/lib/tenant-actions";

/** Admins edit; members see the same fields, read-only. */
export function TenantForm({
  name,
  mediator,
  mediators,
  identity,
  editable,
}: {
  name: string;
  /** The chosen mediator's id; empty for none. */
  mediator: string;
  /** The tenant's mediators, to pick the one its own identity uses. */
  mediators: Item[];
  /** The tenant's own identity; renamed with the tenant by the API. */
  identity: string | null;
  editable: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.tenant;
  const [state, action, pending] = useActionState<TenantState, FormData>(
    saveTenant,
    { name, mediator },
  );
  const round = useAnswerRound(state);
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
        <select
          key={round}
          className="field__input"
          id="mediator"
          name="mediator"
          disabled={!editable}
          defaultValue={state.mediator}
          aria-invalid={errors.mediator ? true : undefined}
          aria-describedby={
            errors.mediator ? "mediator-error" : "mediator-hint"
          }
        >
          <option value="">
            {mediators.length ? t.dashboard.items.noMediator : copy.noMediators}
          </option>
          {mediators.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
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
