"use client";

import Link from "next/link";
import { useActionState } from "react";

import { TrashIcon } from "@/app/components/icons";
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
        <p className="alert" role="alert">
          {copy.failed}
        </p>
      )}
      <div className="form__actions">
        <Link
          className="button button--ghost"
          href={`/dashboard/${section}/${id}`}
        >
          {copy.cancel}
        </Link>
        <button
          className="button button--danger"
          type="submit"
          disabled={pending}
        >
          <TrashIcon />
          {copy.delete}
        </button>
      </div>
    </form>
  );
}
