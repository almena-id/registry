"use client";

import { TrashIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";
import {
  deleteIdentity,
  type IdentityDeleteState,
} from "@/app/lib/directory-actions";

/** Deleting an identity; the API refuses one in use or signed, and says so. */
export function DeleteIdentityForm({ id }: { id: string }) {
  const { t } = useI18n();
  const copy = t.dashboard.publication;
  const own = t.dashboard.identity;
  const [state, action, pending] = useActionState<IdentityDeleteState>(
    deleteIdentity.bind(null, id),
    {},
  );
  const why =
    state.error === "inUse"
      ? own.inUse
      : state.error === "signed"
        ? own.signed
        : state.error === "gone"
          ? own.gone
          : state.error && copy.failed;

  return (
    <form action={action}>
      {why && !pending && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription>{why}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/identities/${id}`}>{copy.cancel}</Link>
        </Button>
        <Button type="submit" variant="danger" disabled={pending}>
          <TrashIcon />
          {copy.delete}
        </Button>
      </div>
    </form>
  );
}
