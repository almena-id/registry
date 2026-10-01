"use client";

import { ChevronRightIcon } from "lucide-react";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { useI18n } from "@/app/i18n/client";
import { deleteCustomField } from "@/app/lib/custom-field-actions";

/** A field as the catalogue lists it: everything already worded. */
export type CatalogueEntry = {
  key: string;
  label: string;
  type: string;
  /** Its facts, one line each: standard, parts, values, bounds. */
  details: string[];
  /** Almena's fields: where its JSON Schema is published. */
  schema?: string;
  /** The tenant's own fields: its id, to delete it. */
  customId?: string;
};

/**
 * One field of the catalogue, as a list row: its label, its key and its
 * type. Opened, its facts — and, for one of the tenant's own, deleting it
 * (refused while a form asks for it).
 */
export function CatalogueRow({ entry }: { entry: CatalogueEntry }) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;
  const [state, remove, removing] = useActionState<{
    error?: keyof typeof copy.errors;
  }>(
    () =>
      entry.customId ? deleteCustomField(entry.customId) : Promise.resolve({}),
    {},
  );

  return (
    <Collapsible asChild>
      <li className="group border-t first:border-t-0">
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent">
          <ChevronRightIcon className="size-4 flex-none text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-semibold">{entry.label}</span>{" "}
            <span className="font-mono text-[12px] text-faint">
              {entry.key}
            </span>
          </span>
          <Badge variant="muted">{entry.type}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-3 px-5 pb-4 pl-12">
          <ul className="grid gap-1 rounded-lg bg-sunk px-3.5 py-3 text-sm">
            {entry.details.map((line) => (
              <li key={line} className="break-words text-muted-foreground">
                {line}
              </li>
            ))}
            {entry.schema && (
              <li>
                <a
                  href={entry.schema}
                  className="font-mono text-[12px] break-all text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.schema}
                </a>
              </li>
            )}
          </ul>
          {entry.customId && (
            <form action={remove} className="flex justify-end">
              <Button
                variant="danger"
                size="sm"
                type="submit"
                disabled={removing}
              >
                {copy.delete}
              </Button>
            </form>
          )}
          {state.error && !removing && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{copy.errors[state.error]}</AlertDescription>
            </Alert>
          )}
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}
