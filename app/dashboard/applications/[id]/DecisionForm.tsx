"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import {
  decideApplication,
  type DecisionState,
} from "@/app/lib/application-actions";

/** Accept or reject, with an optional note the holder will read. */
export function DecisionForm({ id }: { id: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.applications;
  const [state, action, pending] = useActionState<DecisionState, FormData>(
    decideApplication.bind(null, id),
    {},
  );
  return (
    <form action={action} className="grid gap-3">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="note">
          {copy.note}{" "}
          <span className="font-normal text-faint">{copy.optional}</span>
        </FieldLabel>
        <Textarea id="note" name="note" rows={3} maxLength={2000} />
      </Field>
      {state.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors[state.error]}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          name="decision"
          value="rejected"
          variant="danger"
          disabled={pending}
        >
          {copy.reject}
        </Button>
        <Button
          type="submit"
          name="decision"
          value="accepted"
          disabled={pending}
        >
          {copy.accept}
        </Button>
      </div>
    </form>
  );
}
