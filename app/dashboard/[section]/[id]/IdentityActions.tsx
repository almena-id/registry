"use client";

import { TrashIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";

/**
 * An identity's operation, for admins: delete it, on a screen of its own —
 * only one nothing acts as and nobody signed; otherwise the icon is off and
 * says why.
 */
export function IdentityActions({
  id,
  used,
  signed,
}: {
  id: string;
  used: boolean;
  signed: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.publication;
  const own = t.dashboard.identity;
  const why = used ? own.inUse : signed ? own.signed : null;
  return (
    <div className="flex gap-2" role="toolbar" aria-label={copy.actions}>
      {why ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled
          title={why}
          aria-label={copy.delete}
        >
          <TrashIcon />
        </Button>
      ) : (
        <Button
          asChild
          size="icon"
          variant="outline"
          className="text-destructive hover:text-destructive"
        >
          <Link
            href={`/dashboard/identities/${id}/delete`}
            title={copy.delete}
            aria-label={copy.delete}
          >
            <TrashIcon />
          </Link>
        </Button>
      )}
    </div>
  );
}
