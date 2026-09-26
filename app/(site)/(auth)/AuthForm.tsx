"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { authenticate, type AuthState } from "@/app/lib/auth-actions";

export function AuthForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {
    step: "email",
  });
  const errors = state.errors ?? {};
  const error = (key?: keyof typeof t.auth.errors) => (key ? t.auth.errors[key] : null);
  const onCode = state.step === "code";

  return (
    <div className="auth">
      <form className="card auth__card" action={action} noValidate>
        <div className="auth__head">
          <h1 className="auth__title">{onCode ? t.auth.codeTitle : t.auth.title}</h1>
          <p className="auth__lead">
            {onCode ? t.auth.codeLead.replace("{email}", state.email ?? "") : t.auth.lead}
          </p>
        </div>

        {errors.form && (
          <p className="alert" role="alert">
            {error(errors.form)}
          </p>
        )}
        {onCode && state.resent && !errors.code && (
          <p className="notice" role="status">
            {t.auth.resent}
          </p>
        )}

        {onCode ? (
          <>
            <input type="hidden" name="email" value={state.email} />
            <Field
              key="code"
              label={t.auth.code}
              name="code"
              className="field__input field__input--code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
              error={error(errors.code)}
            />
            <button
              className="button button--primary button--block"
              type="submit"
              name="intent"
              value="verify"
              disabled={pending}
            >
              {t.auth.verify}
            </button>
            <div className="auth__links">
              <button className="link" type="submit" name="intent" value="resend" disabled={pending}>
                {t.auth.resend}
              </button>
              <button className="link" type="submit" name="intent" value="change" disabled={pending}>
                {t.auth.changeEmail}
              </button>
            </div>
          </>
        ) : (
          <>
            <Field
              key="email"
              label={t.auth.email}
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              defaultValue={state.email}
              error={error(errors.email)}
            />
            <button
              className="button button--primary button--block"
              type="submit"
              name="intent"
              value="send"
              disabled={pending}
            >
              {t.auth.sendCode}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  error,
  className = "field__input",
  ...input
}: {
  label: string;
  name: string;
  error: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      <input
        className={className}
        id={name}
        name={name}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...input}
      />
      {error && (
        <p className="field__error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
