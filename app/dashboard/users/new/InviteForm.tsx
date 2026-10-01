"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
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

        <div className="grid gap-1.5">
          <Label htmlFor="email">{copy.email}</Label>
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
            <p className="text-[13px] text-destructive" id="email-error">
              {copy.errors[errors.email]}
            </p>
          )}
        </div>

        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">{copy.role}</legend>
          <RadioGroup
            name="role"
            defaultValue={chosen}
            className="grid gap-2 sm:grid-cols-2"
          >
            {roles.map((role) => (
              <Label
                key={role}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-input px-3.5 py-3 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-brand-soft"
              >
                <RadioGroupItem value={role} className="mt-0.5" />
                <span className="grid gap-0.5">
                  <span className="font-semibold">{copy.roles[role]}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {copy.roleHints[role]}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </fieldset>

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
