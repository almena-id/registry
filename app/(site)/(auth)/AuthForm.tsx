"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useI18n } from "@/app/i18n/client";
import type { Provider } from "@/app/lib/api";
import { authenticate, type AuthState } from "@/app/lib/auth-actions";
import { SocialButtons } from "./SocialButtons";

export function AuthForm({
  providers,
  initialError,
}: {
  providers: Provider[];
  /** What a social sign-in that came back here went wrong with. */
  initialError?: NonNullable<AuthState["errors"]>["form"];
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {
    step: "email",
    errors: initialError ? { form: initialError } : undefined,
  });
  const errors = state.errors ?? {};
  const error = (key?: keyof typeof t.auth.errors) => (key ? t.auth.errors[key] : null);
  const onCode = state.step === "code";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-[400px] gap-0 px-7 py-8">
        <form className="flex flex-col gap-[18px]" action={action} noValidate>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-[-0.015em]">
              {onCode ? t.auth.codeTitle : t.auth.title}
            </h1>
            <p className="text-[15px] wrap-anywhere text-muted-foreground">
              {onCode ? t.auth.codeLead.replace("{email}", state.email ?? "") : t.auth.lead}
            </p>
          </div>

          {errors.form && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error(errors.form)}</AlertDescription>
            </Alert>
          )}
          {onCode && state.resent && !errors.code && (
            <Alert variant="notice" role="status">
              <AlertDescription>{t.auth.resent}</AlertDescription>
            </Alert>
          )}

          {onCode ? (
            <>
              <input type="hidden" name="email" value={state.email} />
              <Field
                key="code"
                label={t.auth.code}
                name="code"
                className="h-14 text-center text-[26px] tracking-[0.4em] tabular-nums md:text-[26px]"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                autoFocus
                error={error(errors.code)}
              />
              <Button
                className="w-full"
                size="lg"
                type="submit"
                name="intent"
                value="verify"
                disabled={pending}
              >
                {t.auth.verify}
              </Button>
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  variant="link"
                  className="h-auto p-0"
                  type="submit"
                  name="intent"
                  value="resend"
                  disabled={pending}
                >
                  {t.auth.resend}
                </Button>
                <Button
                  variant="link"
                  className="h-auto p-0"
                  type="submit"
                  name="intent"
                  value="change"
                  disabled={pending}
                >
                  {t.auth.changeEmail}
                </Button>
              </div>
            </>
          ) : (
            <>
              <SocialButtons providers={providers} />
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
              <Button
                className="w-full"
                size="lg"
                type="submit"
                name="intent"
                value="send"
                disabled={pending}
              >
                {t.auth.sendCode}
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  error,
  className,
  ...input
}: {
  label: string;
  name: string;
  error: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        className={className}
        id={name}
        name={name}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...input}
      />
      {error && (
        <p className="text-[13px] text-destructive" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
