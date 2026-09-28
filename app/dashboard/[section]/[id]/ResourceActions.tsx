"use client";

import Link from "next/link";
import { useActionState } from "react";

import { EyeOffIcon, GlobeIcon, TrashIcon } from "@/app/components/icons";
import { useI18n } from "@/app/i18n/client";
import {
  setPublished,
  type PublicationState,
} from "@/app/lib/directory-actions";

/**
 * The operations on an issuer, verifier or mediator, as icons beside its
 * title: publish or take it back, and delete (which asks first, on a screen
 * of its own). Admins only; the page does not draw it for anyone else.
 */
export function ResourceActions({
  section,
  id,
  published,
}: {
  section: "issuers" | "verifiers" | "mediators";
  id: string;
  published: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.publication;
  const [state, action, pending] = useActionState<PublicationState>(
    setPublished.bind(null, section, id),
    { published },
  );
  const toggle = state.published ? copy.unpublish : copy.publish;

  return (
    <div className="toolbar">
      <div
        className="toolbar__buttons"
        role="toolbar"
        aria-label={copy.actions}
      >
        <form action={action}>
          <button
            className="button button--icon"
            type="submit"
            disabled={pending}
            title={toggle}
            aria-label={toggle}
          >
            {state.published ? <EyeOffIcon /> : <GlobeIcon />}
          </button>
        </form>
        <Link
          className="button button--icon button--danger"
          href={`/dashboard/${section}/${id}/delete`}
          title={copy.delete}
          aria-label={copy.delete}
        >
          <TrashIcon />
        </Link>
      </div>
      {state.failed && !pending && (
        <p className="alert" role="alert">
          {copy.failed}
        </p>
      )}
    </div>
  );
}
