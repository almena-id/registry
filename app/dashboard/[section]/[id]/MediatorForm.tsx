"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { saveMediator, type MediatorState } from "@/app/lib/directory-actions";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import { AddressField } from "./AddressField";
import { PublicField } from "./PublicField";

/**
 * A mediator's name, address and whether it is public; any member of the
 * tenant may change them. Its address is a `subdomain` of one of the tenant's
 * verified `domains`, as when registered; when its `url` is on none of them
 * the subdomain starts empty, which keeps it where it is.
 */
export function MediatorForm({
  id,
  name,
  url,
  subdomain,
  domain,
  domains,
  isPublic,
}: {
  id: string;
  name: string;
  url: string;
  subdomain: string;
  domain: string | undefined;
  domains: { id: string; domain: string }[];
  isPublic: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<MediatorState, FormData>(
    saveMediator.bind(null, id),
    { name, subdomain, domain, public: isPublic },
  );
  const round = useAnswerRound(state);
  const errors = state.errors ?? {};

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        {errors.form && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors[errors.form]}</AlertDescription>
          </Alert>
        )}
        {state.saved && !pending && (
          <Alert variant="notice" role="status">
            <AlertDescription>{t.dashboard.mediator.saved}</AlertDescription>
          </Alert>
        )}

        <Field
          data-invalid={errors.name ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="name">{copy.name}</FieldLabel>
          <Input
            id="name"
            name="name"
            maxLength={200}
            required
            defaultValue={state.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <FieldError className="text-[13px]" id="name-error">
              {copy.errors[errors.name]}
            </FieldError>
          )}
        </Field>

        <AddressField
          domains={domains}
          subdomain={state.subdomain}
          domain={state.domain}
          error={
            errors.subdomain || errors.domain
              ? copy.errors[(errors.subdomain ?? errors.domain)!]
              : null
          }
          round={round}
          hint={subdomain ? undefined : copy.keepAddress.replace("{url}", url)}
        />

        <PublicField key={round} defaultChecked={state.public ?? false} />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {t.dashboard.mediator.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
