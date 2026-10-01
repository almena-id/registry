"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/components/ui/field";
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
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        {errors.form && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors[errors.form]}</AlertDescription>
          </Alert>
        )}

        <Field
          data-invalid={errors.email ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="email">{copy.email}</FieldLabel>
          <Input
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
            <FieldError className="text-[13px]" id="email-error">
              {copy.errors[errors.email]}
            </FieldError>
          )}
        </Field>

        <FieldSet className="grid gap-1.5">
          <FieldLegend variant="label" className="mb-1.5 text-sm font-medium">
            {copy.role}
          </FieldLegend>
          <RadioGroup
            name="role"
            defaultValue={chosen}
            className="grid gap-2 sm:grid-cols-2"
          >
            {roles.map((role) => (
              <FieldLabel
                key={role}
                className="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border border-input px-3.5 py-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-brand-soft dark:has-data-[state=checked]:bg-brand-soft"
              >
                <RadioGroupItem value={role} className="mt-0.5" />
                <span className="grid gap-0.5">
                  <span className="font-semibold">{copy.roles[role]}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {copy.roleHints[role]}
                  </span>
                </span>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard/users">{copy.cancel}</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {copy.send}
          </Button>
        </div>
      </form>
    </Card>
  );
}
