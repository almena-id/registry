"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";
import { startApplication } from "@/app/lib/application-actions";

/** "Start": opens an application for the offer, kept by this browser. */
export function StartForm({ issuer, type }: { issuer: string; type: string }) {
  const { t } = useI18n();
  const copy = t.apply;
  const [state, action, pending] = useActionState<{ error?: "unavailable" }>(
    () => startApplication(issuer, type),
    {},
  );
  return (
    <form action={action} className="grid gap-3">
      {state.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors.unavailable}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="justify-self-start"
      >
        {copy.start}
      </Button>
    </form>
  );
}
