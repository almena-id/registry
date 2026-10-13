"use client";

import { PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useI18n } from "@/app/i18n/client";
import { deleteForm } from "@/app/lib/form-actions";

/**
 * The operations on a form, as icons beside its title: edit it, and delete
 * it — asked first, beside the icons — while nothing uses it; in use, the
 * delete icon is off and says why.
 */
export function FormActions({ id, inUse }: { id: string; inUse: boolean }) {
  const { t } = useI18n();
  const copy = t.dashboard.forms;
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<keyof typeof copy.errors>();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2" role="toolbar">
        {asking ? (
          <span className="flex flex-wrap items-center justify-end gap-2 text-sm">
            {copy.deleteAsk}
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await deleteForm(id);
                  setError(result.error);
                  setAsking(false);
                })
              }
            >
              {copy.confirm}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAsking(false)}
            >
              {copy.keep}
            </Button>
          </span>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="outline">
                  <Link href={`/dashboard/forms/${id}/edit`} aria-label={copy.edit}>
                    <PencilIcon />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copy.edit}</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={inUse}
              title={inUse ? copy.deleteInUse : copy.delete}
              aria-label={copy.delete}
              onClick={() => setAsking(true)}
            >
              <TrashIcon />
            </Button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-destructive">
          {copy.errors[error]}
        </p>
      )}
    </div>
  );
}
