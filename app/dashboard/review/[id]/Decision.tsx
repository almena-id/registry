"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import { decide, type StepState } from "@/app/lib/certification-actions";

/** Approve, or reject saying why: the tenant reads the reason. */
export function Decision({ id }: { id: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.review;
  const [state, action, pending] = useActionState<StepState, FormData>(
    decide.bind(null, id),
    {},
  );

  return (
    <form className="card form form--wide" action={action} noValidate>
      {state.error && (
        <p className="alert" role="alert">
          {t.dashboard.certification.errors[state.error]}
        </p>
      )}
      <div className="field">
        <label className="field__label" htmlFor="reason">
          {copy.reason}{" "}
          <span className="field__optional">{copy.reasonHint}</span>
        </label>
        <textarea
          className="field__input field__input--area"
          id="reason"
          name="reason"
          rows={3}
          maxLength={1000}
        />
      </div>
      <div className="form__actions">
        <button
          className="button button--ghost"
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
        >
          {copy.reject}
        </button>
        <button
          className="button button--primary"
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
        >
          {copy.approve}
        </button>
      </div>
    </form>
  );
}
