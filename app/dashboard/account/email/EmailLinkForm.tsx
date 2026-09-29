"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useI18n } from "@/app/i18n/client";
import { linkEmail, type EmailLinkState } from "@/app/lib/ways-in-actions";

export function EmailLinkForm() {
  const { t } = useI18n();
  const copy = t.dashboard.account.emailLink;
  const errorText = t.dashboard.account.errors;
  const [state, action, pending] = useActionState<EmailLinkState, FormData>(
    linkEmail,
    { step: "email" },
  );
  const errors = state.errors ?? {};
  const onCode = state.step === "code";
  const fieldError = onCode ? errors.code : errors.email;
  const name = onCode ? "code" : "email";

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {onCode ? copy.codeTitle : copy.title}
        </h1>
        <p className="text-muted-foreground">
          {onCode ? copy.codeLead.replace("{email}", state.email ?? "") : copy.lead}
        </p>
      </header>
      <Card className="max-w-[560px] gap-0 p-6">
        <form className="flex flex-col gap-[18px]" action={action} noValidate>
          {errors.form && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorText[errors.form]}</AlertDescription>
            </Alert>
          )}
          {onCode && state.resent && !errors.code && (
            <Alert variant="notice" role="status">
              <AlertDescription>{copy.resent}</AlertDescription>
            </Alert>
          )}
          {onCode && <input type="hidden" name="email" value={state.email} />}

          <div className="grid gap-1.5">
            <Label htmlFor={name}>{onCode ? copy.code : t.dashboard.account.waysIn.email}</Label>
            <Input
              key={name}
              className={
                onCode
                  ? "h-14 text-center text-[26px] tracking-[0.4em] tabular-nums md:text-[26px]"
                  : undefined
              }
              id={name}
              name={name}
              required
              autoFocus
              {...(onCode
                ? {
                    inputMode: "numeric",
                    autoComplete: "one-time-code",
                    pattern: "\\d{6}",
                    maxLength: 6,
                  }
                : { type: "email", autoComplete: "email", defaultValue: state.email })}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `${name}-error` : undefined}
            />
            {fieldError && (
              <p className="text-[13px] text-destructive" id={`${name}-error`}>
                {errorText[fieldError]}
              </p>
            )}
          </div>

          {/* The main button comes first: Enter submits the first one. */}
          <div className="flex justify-end gap-2">
            {!onCode && (
              <Button asChild variant="ghost">
                <Link href="/dashboard/account">{copy.cancel}</Link>
              </Button>
            )}
            <Button
              type="submit"
              name="intent"
              value={onCode ? "verify" : "send"}
              disabled={pending}
            >
              {onCode ? copy.verify : copy.send}
            </Button>
          </div>
          {onCode && (
            <div className="flex flex-wrap justify-between gap-2">
              <Button
                variant="link"
                className="h-auto p-0"
                type="submit"
                name="intent"
                value="resend"
                disabled={pending}
              >
                {copy.resend}
              </Button>
              <Button
                variant="link"
                className="h-auto p-0"
                type="submit"
                name="intent"
                value="change"
                disabled={pending}
              >
                {copy.changeEmail}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </>
  );
}
