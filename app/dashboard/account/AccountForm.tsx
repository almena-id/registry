"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { saveAccount, type AccountState } from "@/app/lib/account-actions";

export function AccountForm({
  email,
  alias,
}: {
  email: string;
  alias: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.account;
  const [state, action, pending] = useActionState<AccountState, FormData>(
    saveAccount,
    {
      alias,
    },
  );
  const errors = state.errors ?? {};

  return (
    <form className="card form" action={action} noValidate>
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
        <label className="field__label" htmlFor="alias">
          {copy.alias}
        </label>
        <input
          className="field__input"
          id="alias"
          name="alias"
          maxLength={100}
          autoComplete="nickname"
          defaultValue={state.alias}
          aria-invalid={errors.alias ? true : undefined}
          aria-describedby={errors.alias ? "alias-error" : "alias-hint"}
        />
        {errors.alias ? (
          <p className="field__error" id="alias-error">
            {copy.errors[errors.alias]}
          </p>
        ) : (
          <p className="field__hint" id="alias-hint">
            {copy.aliasHint}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="email">
          {copy.email}
        </label>
        <input
          className="field__input"
          id="email"
          value={email}
          readOnly
          aria-describedby="email-hint"
        />
        <p className="field__hint" id="email-hint">
          {copy.emailHint}
        </p>
      </div>

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
