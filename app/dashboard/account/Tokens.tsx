"use client";

import { useActionState, useState, useTransition } from "react";

import { CopyButton } from "@/app/components/CopyButton";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { formatDateTime } from "@/app/lib/format";
import {
  createToken,
  revokeToken,
  type TokenState,
} from "@/app/lib/token-actions";
import type { ApiToken } from "@/app/lib/tokens";

/**
 * The account's API tokens, for scripts, CI and the `almena` command line:
 * each acts as the account until it expires or is revoked. A new one's secret
 * shows once, right after it is made.
 */
export function Tokens({
  tokens,
  timeZone,
}: {
  tokens: ApiToken[] | null;
  timeZone: string;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.account.tokens;
  const [state, action, pending] = useActionState<TokenState, FormData>(
    createToken,
    { days: "90" },
  );
  const [revoking, startRevoking] = useTransition();
  // The token whose revocation is being asked about.
  const [asking, setAsking] = useState<string | null>(null);
  const errors = state.errors ?? {};
  const when = (value: string) => formatDateTime(value, locale, timeZone);

  return (
    // The card's look on a <section>: a region of its own, with its heading.
    <section className="mt-4 rounded-2xl border bg-card px-6 py-5 text-card-foreground shadow-card">
      <h2 className="mb-1 text-[15px] font-semibold">{copy.title}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{copy.hint}</p>

      {state.secret && (
        <Alert variant="notice" role="status" className="mb-3">
          <AlertDescription className="grid gap-2">
            <span>{copy.secretOnce.replace("{name}", state.made ?? "")}</span>
            <span className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-sunk px-2 py-1 font-mono text-[13px] break-all">
                {state.secret}
              </code>
              <CopyButton
                text={state.secret}
                label={copy.copy}
                done={copy.copied}
              />
            </span>
          </AlertDescription>
        </Alert>
      )}
      {errors.form && (
        <Alert variant="destructive" role="alert" className="mb-3">
          <AlertDescription>{copy.errors[errors.form]}</AlertDescription>
        </Alert>
      )}

      {tokens === null ? (
        <p className="mb-3 text-sm text-destructive">
          {copy.errors.unavailable}
        </p>
      ) : tokens.length === 0 ? (
        <p className="mb-3 text-sm text-faint">{copy.none}</p>
      ) : (
        <ul className="mb-4 flex flex-col">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex items-center justify-between gap-4 border-t py-3 first:border-t-0 max-sm:flex-col max-sm:items-start"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold">{token.name}</span>
                <span className="text-[13px] text-muted-foreground">
                  {copy.expires.replace("{date}", when(token.expires_at))}
                  {" · "}
                  {copy.lastUsed.replace("{date}", when(token.last_used_at))}
                </span>
              </div>
              {asking === token.id ? (
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  {copy.revokeAsk}
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={revoking}
                    onClick={() =>
                      startRevoking(async () => {
                        await revokeToken(token.id);
                        setAsking(null);
                      })
                    }
                  >
                    {copy.revoke}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAsking(null)}
                  >
                    {copy.cancel}
                  </Button>
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAsking(token.id)}
                >
                  {copy.revoke}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-start"
        action={action}
        noValidate
      >
        <Field
          data-invalid={errors.name ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="token-name">{copy.name}</FieldLabel>
          <Input
            id="token-name"
            name="name"
            maxLength={100}
            required
            placeholder={copy.namePlaceholder}
            defaultValue={state.secret ? "" : state.name}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name && (
            <FieldError className="text-[13px]">
              {copy.errors[errors.name]}
            </FieldError>
          )}
        </Field>
        <Field
          data-invalid={errors.days ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="token-days">{copy.days}</FieldLabel>
          <Input
            id="token-days"
            name="days"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={state.days ?? "90"}
            aria-invalid={errors.days ? true : undefined}
          />
          {errors.days ? (
            <FieldError className="text-[13px]">
              {copy.errors[errors.days]}
            </FieldError>
          ) : (
            <FieldDescription className="text-[13px] text-faint">
              {copy.daysHint}
            </FieldDescription>
          )}
        </Field>
        <Button type="submit" disabled={pending} className="sm:mt-[22px]">
          {copy.create}
        </Button>
      </form>
    </section>
  );
}
