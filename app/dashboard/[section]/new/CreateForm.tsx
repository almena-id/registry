"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Select } from "@/app/components/Select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { PublicField } from "@/app/dashboard/[section]/[id]/PublicField";
import { useI18n } from "@/app/i18n/client";
import { useAnswerRound } from "@/app/lib/use-answer-round";
import { createItem, type CreateState } from "@/app/lib/directory-actions";
import {
  mediatorOptions,
  type MediatorChoice,
  type Section,
} from "@/app/lib/directory-types";

/**
 * Issuers and verifiers are `described` and pick one of the `mediators`
 * (the tenant's, or a public one); mediators have an address and may be public. Each gets an identity of its own,
 * named like it, which the API creates.
 */
export function CreateForm({
  section,
  described,
  mediators,
}: {
  section: Section;
  described: boolean;
  mediators: MediatorChoice[] | null;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createItem.bind(null, section),
    {},
  );
  const round = useAnswerRound(state);
  const errors = state.errors ?? {};
  const error = (key?: keyof typeof copy.errors) =>
    key ? copy.errors[key] : null;

  return (
    <Card className="max-w-[560px] gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        {errors.form && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error(errors.form)}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="name">{copy.name}</Label>
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
            <p className="text-[13px] text-destructive" id="name-error">
              {error(errors.name)}
            </p>
          )}
        </div>

        {described && (
          <div className="grid gap-1.5">
            <Label htmlFor="description">
              {copy.description}{" "}
              <span className="font-normal text-faint">{copy.optional}</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={state.description}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
            />
            {errors.description && (
              <p
                className="text-[13px] text-destructive"
                id="description-error"
              >
                {error(errors.description)}
              </p>
            )}
          </div>
        )}

        {section === "mediators" && (
          <div className="grid gap-1.5">
            <Label htmlFor="url">{copy.url}</Label>
            <Input
              id="url"
              name="url"
              inputMode="url"
              maxLength={2048}
              required
              placeholder="https://mediator.example.org"
              defaultValue={state.url}
              aria-invalid={errors.url ? true : undefined}
              aria-describedby={errors.url ? "url-error" : "url-hint"}
            />
            {errors.url ? (
              <p className="text-[13px] text-destructive" id="url-error">
                {error(errors.url)}
              </p>
            ) : (
              <p className="text-[13px] text-faint" id="url-hint">
                {copy.urlHint}
              </p>
            )}
          </div>
        )}

        {section === "mediators" && (
          <PublicField key={round} defaultChecked={state.public ?? false} />
        )}

        {mediators && (
          <div className="grid gap-1.5">
            <Label htmlFor="mediator">
              {copy.mediator}{" "}
              <span className="font-normal text-faint">{copy.optional}</span>
            </Label>
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
              <p className="text-[13px] text-destructive" id="mediator-error">
                {error(errors.mediator)}
              </p>
            )}
          </div>
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
