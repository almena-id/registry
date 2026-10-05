"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { cn } from "cn";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { MultilingualInput } from "@/app/components/MultilingualInput";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { AddressField } from "@/app/dashboard/[section]/[id]/AddressField";
import { PublicField } from "@/app/dashboard/[section]/[id]/PublicField";
import { useI18n } from "@/app/i18n/client";
import type { Texts } from "@/app/lib/texts";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import { createItem, type CreateState } from "@/app/lib/directory-actions";
import {
  mediatorOptions,
  type MediatorChoice,
  type Section,
} from "@/app/lib/directory-types";

/**
 * Issuers and verifiers are `described` and pick one of the `mediators`
 * (the tenant's, or a public one); mediators listen on a subdomain of one of
 * the tenant's verified `domains` and may be public. Each gets an identity of
 * its own, named like it, which the API creates.
 */
export function CreateForm({
  section,
  described,
  mediators,
  domains,
}: {
  section: Section;
  described: boolean;
  mediators: MediatorChoice[] | null;
  domains: { id: string; domain: string }[] | null;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createItem.bind(null, section),
    {},
  );
  const round = useAnswerRound(state);
  const [description, setDescription] = useState<Texts>(
    state.description ?? {},
  );
  const errors = state.errors ?? {};
  const error = (key?: keyof typeof copy.errors) =>
    key ? copy.errors[key] : null;
  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        {errors.form && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error(errors.form)}</AlertDescription>
          </Alert>
        )}

        {/* Mediators: the name and the address on one line. */}
        <div
          className={cn(
            "flex flex-col gap-[18px]",
            domains &&
              "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start",
          )}
        >
          <Field
            data-invalid={errors.name ? true : undefined}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="name">{copy.name}</FieldLabel>
            <Input
              id="name"
              name="name"
              maxLength={200}
              autoFocus
              required
              defaultValue={state.name}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <FieldError className="text-[13px]" id="name-error">
                {error(errors.name)}
              </FieldError>
            )}
          </Field>

          {domains && (
            <AddressField
              domains={domains}
              subdomain={state.subdomain}
              domain={state.domain}
              error={error(errors.subdomain ?? errors.domain)}
              round={round}
            />
          )}
        </div>

        {described && (
          <Field
            data-invalid={errors.description ? true : undefined}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="description">
              {copy.description}{" "}
              <span className="font-normal text-faint">{copy.optional}</span>
            </FieldLabel>
            <MultilingualInput
              id="description"
              name="description"
              value={description}
              onChange={setDescription}
              multiline
              rows={4}
              maxLength={2000}
              invalid={Boolean(errors.description)}
              describedBy={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <FieldError className="text-[13px]" id="description-error">
                {error(errors.description)}
              </FieldError>
            )}
          </Field>
        )}

        {section === "mediators" && (
          <PublicField key={round} defaultChecked={state.public ?? false} />
        )}

        {mediators && (
          <Field
            data-invalid={errors.mediator ? true : undefined}
            className="gap-1.5"
          >
            <FieldLabel htmlFor="mediator">
              {copy.mediator}{" "}
              <span className="font-normal text-faint">{copy.optional}</span>
            </FieldLabel>
            <Select
              key={round}
              id="mediator"
              name="mediator"
              defaultValue={state.mediator ?? ""}
              aria-invalid={errors.mediator ? true : undefined}
              aria-describedby={errors.mediator ? "mediator-error" : undefined}
              options={[
                { value: "", label: copy.noMediator },
                ...mediatorOptions(mediators, copy.publicMediator),
              ]}
            />
            {errors.mediator && (
              <FieldError className="text-[13px]" id="mediator-error">
                {error(errors.mediator)}
              </FieldError>
            )}
          </Field>
        )}

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href={`/dashboard/${section}`}>{copy.cancel}</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {copy.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
