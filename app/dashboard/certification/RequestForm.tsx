"use client";

import { useActionState } from "react";

import { useI18n } from "@/app/i18n/client";
import {
  checkDomain,
  saveRequest,
  submitRequest,
  uploadLogo,
  type StepState,
} from "@/app/lib/certification-actions";
import { logoTypes, type Certification } from "@/app/lib/certification-types";

/**
 * The request, in the order it is made: who the tenant is and its domain,
 * the DNS record that proves the domain, the logo, then sending it. Without
 * a request, saving opens one from what is in force (`current`).
 */
export function RequestForm({
  request,
  current,
  admin,
}: {
  request: Certification | null;
  current: Certification | null;
  admin: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.certification;
  const [saved, save, saving] = useActionState<StepState, FormData>(
    saveRequest,
    {},
  );
  const [checked, check, checking] = useActionState<StepState, FormData>(
    checkDomain,
    {},
  );
  const [logoState, upload, uploading] = useActionState<StepState, FormData>(
    uploadLogo,
    {},
  );
  const [sent, send, sending] = useActionState<StepState, FormData>(
    submitRequest,
    {},
  );

  const shown = request ?? current;
  const reviewing = request?.status === "in_review";
  const editable = admin && !reviewing;
  const complete = Boolean(
    request?.legal_name && request.domain_verified && request.logo,
  );
  const error = (state: StepState) =>
    state.error ? (
      <p className="field__error" role="alert">
        {copy.errors[state.error]}
      </p>
    ) : null;

  return (
    <section className="card form form--wide cert__request">
      <header className="cert__head">
        <h2 className="identity__title">
          {current ? copy.changeTitle : copy.requestTitle}
        </h2>
        {request && (
          <span className={`tag tag--status-${request.status}`}>
            {copy.status[request.status]}
          </span>
        )}
      </header>

      {!admin && (
        <p className="notice" role="status">
          {copy.readOnly}
        </p>
      )}
      {reviewing && (
        <p className="notice" role="status">
          {copy.waiting}
        </p>
      )}
      {request?.status === "rejected" && request.reason && (
        <p className="alert" role="alert">
          {copy.rejected} {request.reason}
        </p>
      )}

      {/* 1. Who: the legal name and the domain. */}
      <form className="cert__step" action={save} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="legal_name">
            {copy.legalName}
          </label>
          <input
            className="field__input"
            id="legal_name"
            name="legal_name"
            maxLength={200}
            required
            readOnly={!editable}
            defaultValue={shown?.legal_name ?? ""}
            aria-invalid={saved.field === "legalName" ? true : undefined}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="domain">
            {copy.domain}
          </label>
          <input
            className="field__input"
            id="domain"
            name="domain"
            inputMode="url"
            maxLength={253}
            required
            readOnly={!editable}
            placeholder="acme.com"
            defaultValue={shown?.domain ?? ""}
            aria-invalid={saved.field === "domain" ? true : undefined}
            aria-describedby="domain-hint"
          />
          <p className="field__hint" id="domain-hint">
            {copy.domainHint}
          </p>
        </div>
        {error(saved)}
        {editable && (
          <div className="form__actions">
            <button
              className="button button--ghost"
              type="submit"
              disabled={saving}
            >
              {copy.save}
            </button>
          </div>
        )}
      </form>

      {/* 2. The proof: a TXT record under the domain. */}
      <div className="cert__step">
        <h3 className="field__label">{copy.dnsTitle}</h3>
        {/* Without a request, the record that proved what is in force. */}
        {shown?.dns_record ? (
          <>
            <dl className="facts cert__record">
              <div>
                <dt>{copy.dnsType}</dt>
                <dd className="facts__mono">{shown.dns_record.type}</dd>
              </div>
              <div>
                <dt>{copy.dnsName}</dt>
                <dd className="facts__mono">{shown.dns_record.name}</dd>
              </div>
              <div>
                <dt>{copy.dnsValue}</dt>
                <dd className="facts__mono">{shown.dns_record.value}</dd>
              </div>
            </dl>
            {shown.domain_verified ? (
              <p className="notice" role="status">
                {copy.dnsVerified}
              </p>
            ) : (
              <form action={check} className="form__actions">
                <span className="field__hint">{copy.dnsHint}</span>
                {editable && request && (
                  <button
                    className="button button--ghost"
                    type="submit"
                    disabled={checking}
                  >
                    {copy.check}
                  </button>
                )}
              </form>
            )}
            {error(checked)}
          </>
        ) : (
          <p className="facts__empty">{copy.dnsFirst}</p>
        )}
      </div>

      {/* 3. The image wallets will show. */}
      <form className="cert__step" action={upload}>
        <h3 className="field__label">{copy.logo}</h3>
        <div className="cert__logo-row">
          {shown?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cert__logo" src={shown.logo} alt="" />
          ) : (
            <span className="cert__logo cert__logo--empty" aria-hidden="true" />
          )}
          {editable && (
            <>
              <input
                className="cert__file"
                type="file"
                name="logo"
                accept={logoTypes.join(",")}
                aria-label={copy.logo}
                aria-describedby="logo-hint"
              />
              <button
                className="button button--ghost"
                type="submit"
                disabled={uploading}
              >
                {copy.upload}
              </button>
            </>
          )}
        </div>
        <p className="field__hint" id="logo-hint">
          {copy.logoHint}
        </p>
        {error(logoState)}
      </form>

      {/* 4. Sending it. */}
      {editable && request && (
        <form action={send} className="form__actions cert__send">
          {!complete && (
            <span className="field__hint">{copy.incompleteHint}</span>
          )}
          <button
            className="button button--primary"
            type="submit"
            disabled={!complete || sending}
          >
            {copy.submit}
          </button>
        </form>
      )}
      {error(sent)}
    </section>
  );
}
