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
 * title: publish — which is endorsing it, signed from a wallet on a screen of
 * its own — or take it back, and delete (which asks first, on its own screen
 * too). Admins only; the page does not draw it for anyone else.
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
        {state.published ? (
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
                  <EyeOffIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{toggle}</TooltipContent>
            </Tooltip>
          </form>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild size="icon" variant="outline">
                <Link
                  href={`/dashboard/${section}/${id}/publish`}
                  aria-label={toggle}
                >
                  <GlobeIcon />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{toggle}</TooltipContent>
          </Tooltip>
        )}
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
      {(state.failed || state.pendingIdentity) && !pending && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {state.pendingIdentity ? copy.identityPending : copy.failed}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
