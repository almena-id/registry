"use client";

import { GlobeIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";
import { publishNow, type PublishState } from "@/app/lib/publish-actions";

/**
 * Publishing when the account signs with no wallet (its signing flow `none`):
 * the decision is the button; the platform endorses it at once.
 */
export function PublishForm({
  section,
  id,
}: {
  section: "issuers" | "verifiers" | "mediators";
  id: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.publication;
  const errors = t.wallet.errors;
  const [state, action, pending] = useActionState<PublishState>(
    publishNow.bind(null, section, id),
    {},
  );

  return (
    <form action={action}>
      {state.error !== undefined && !pending && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription>
            {(state.error && errors[state.error as keyof typeof errors]) ||
              copy.failed}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/${section}/${id}`}>{copy.cancel}</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          <GlobeIcon />
          {copy.publish}
        </Button>
      </div>
    </form>
  );
}
