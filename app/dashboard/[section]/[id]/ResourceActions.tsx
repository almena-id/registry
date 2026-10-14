"use client";

import { EyeOffIcon, GlobeIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useI18n } from "@/app/i18n/client";
import {
  setPublished,
  type PublicationState,
} from "@/app/lib/directory-actions";

/**
 * The operations on an issuer, verifier or mediator, as icons beside its
 * title: publish or take it back — an admin's decision, no signature — and
 * delete (which asks first, on its own screen). For admins only; the page
 * draws it for nobody else.
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

  // The buttons on one row; a failure shows under them, aligned right.
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2" role="toolbar" aria-label={copy.actions}>
        <form className="contents" action={action}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                variant="outline"
                disabled={pending}
                aria-label={toggle}
              >
                {state.published ? <EyeOffIcon /> : <GlobeIcon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{toggle}</TooltipContent>
          </Tooltip>
        </form>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon" variant="danger">
              <Link
                href={`/dashboard/${section}/${id}/delete`}
                aria-label={copy.delete}
              >
                <TrashIcon />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copy.delete}</TooltipContent>
        </Tooltip>
      </div>
      {(state.failed || state.pendingIdentity || state.pendingTenant) &&
        !pending && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {state.pendingIdentity
                ? copy.identityPending
                : state.pendingTenant
                  ? copy.tenantPending
                  : copy.failed}
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
