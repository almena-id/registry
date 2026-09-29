"use client";

import { TrashIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";
import { deleteItem, type PublicationState } from "@/app/lib/directory-actions";

export function DeleteForm({
  section,
  id,
}: {
  section: "issuers" | "verifiers" | "mediators";
  id: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.publication;
  const [state, action, pending] = useActionState<PublicationState>(
    deleteItem.bind(null, section, id),
    { published: false },
  );

  return (
    <form action={action}>
      {state.failed && !pending && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.failed}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/${section}/${id}`}>{copy.cancel}</Link>
        </Button>
        <Button type="submit" variant="danger" disabled={pending}>
          <TrashIcon />
          {copy.delete}
        </Button>
      </div>
    </form>
  );
}
