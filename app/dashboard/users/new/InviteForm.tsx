"use client";

import Link from "next/link";
import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { invite, type InviteState } from "@/app/lib/member-actions";

const roles = ["member", "admin"] as const;

export function InviteForm() {
  const { t } = useI18n();
  const copy = t.dashboard.users;
  const [state, action, pending] = useActionState<InviteState, FormData>(
    invite,
    {},
  );
  const errors = state.errors ?? {};
  const chosen = state.role === "admin" ? "admin" : "member";

  return (
    <form className="card form" action={action} noValidate>
      {errors.form && (
        <p className="alert" role="alert">
          {copy.errors[errors.form]}
        </p>
      )}

      <div className="field">
        <label className="field__label" htmlFor="email">
          {copy.email}
        </label>
        <input
          className="field__input"
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          autoFocus
          required
          defaultValue={state.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p className="field__error" id="email-error">
            {copy.errors[errors.email]}
          </p>
        )}
      </div>

      <fieldset className="field">
        <legend className="field__label">{copy.role}</legend>
        <div className="choices">
          {roles.map((role) => (
            <label key={role} className="choice">
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={role === chosen}
              />
              <span className="choice__text">
                <span className="choice__title">{copy.roles[role]}</span>
                <span className="choice__hint">{copy.roleHints[role]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form__actions">
        <Link className="button button--ghost" href="/dashboard/users">
          {copy.cancel}
        </Link>
        <button
          className="button button--primary"
          type="submit"
          disabled={pending}
        >
          {copy.send}
        </button>
      </div>
    </form>
  );
}
