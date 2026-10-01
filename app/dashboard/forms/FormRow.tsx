"use client";

import { ChevronRightIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { useI18n } from "@/app/i18n/client";
import { label, type DescribedField } from "@/app/lib/form-fields";
import type { Texts } from "@/app/lib/texts";
import { formatCount } from "@/app/lib/plural";

type Form = {
  id: string;
  name: Texts;
  description: Texts | null;
  created_at: string;
};

/** A credential the form asks for, already worded. */
export type DescribedCredential = {
  key: string;
  label: string;
  required: boolean;
  purpose?: string;
  claims: string[];
  trust: string;
  fills: string[];
};

/**
 * One form, as a list row: its name, how many fields and when it
 * was created. Opened, its description and its fields in order — each a field
 * of the catalogue, with its type, the parts of a group and what the form
 * restricts in it.
 */
export function FormRow({
  form,
  fields,
  credentials,
  created,
}: {
  form: Form;
  /** The credentials it asks to be presented, already worded. */
  credentials: DescribedCredential[];
  /** Its fields, already worded in the visitor's language. */
  fields: DescribedField[];
  /** `created_at`, already written in the visitor's locale and zone. */
  created: string;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.forms;

  return (
    <Collapsible asChild>
      <li className="group border-t first:border-t-0">
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent">
          <ChevronRightIcon className="size-4 flex-none text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {label(form.name, locale)}
          </span>
          <span className="flex-none text-[13px] text-muted-foreground max-sm:hidden">
            {formatCount(copy.fieldCount, fields.length, locale)}
            {credentials.length > 0 &&
              ` · ${formatCount(copy.credentialCount, credentials.length, locale)}`}
          </span>
          <time
            className="flex-none text-[13px] text-faint tabular-nums max-sm:hidden"
            dateTime={form.created_at}
            title={copy.created}
          >
            {created}
          </time>
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-3 px-5 pb-4 pl-12">
          {form.description && (
            <p className="text-sm text-muted-foreground">
              {label(form.description, locale)}
            </p>
          )}
          <ol className="grid gap-2 rounded-lg bg-sunk px-3.5 py-3">
            {fields.map((field) => (
              <li
                key={field.key}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t pt-2 text-sm first:border-t-0 first:pt-0"
              >
                <span className="grid gap-0.5">
                  <span className="font-medium">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive" title={copy.required}>
                        {" "}
                        *
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[12px] text-faint">
                    {field.key}
                  </span>
                  {field.help && (
                    <span className="text-[13px] text-muted-foreground">
                      {field.help}
                    </span>
                  )}
                </span>
                <span className="grid max-w-[60%] justify-items-end gap-0.5 text-right">
                  <span>{field.type}</span>
                  {field.parts.length > 0 && (
                    <span className="text-[13px] text-muted-foreground">
                      {copy.includes} {field.parts.join(", ")}
                    </span>
                  )}
                  {field.restrictions.map((line) => (
                    <span
                      key={line}
                      className="text-[13px] text-muted-foreground"
                    >
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
          {credentials.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
                {copy.credentials}
              </p>
              <ul className="grid gap-2 rounded-lg bg-sunk px-3.5 py-3">
                {credentials.map((credential) => (
                  <li
                    key={credential.key}
                    className="grid gap-0.5 border-t pt-2 text-sm first:border-t-0 first:pt-0"
                  >
                    <span className="font-medium">
                      {credential.label}
                      {credential.required && (
                        <span
                          className="text-destructive"
                          title={copy.required}
                        >
                          {" "}
                          *
                        </span>
                      )}{" "}
                      <span className="font-mono text-[12px] font-normal text-faint">
                        {credential.key}
                      </span>
                    </span>
                    {credential.purpose && (
                      <span className="text-[13px] text-muted-foreground">
                        {credential.purpose}
                      </span>
                    )}
                    <span className="text-[13px] text-muted-foreground">
                      {copy.claims}: {credential.claims.join(", ")}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {copy.trust}: {credential.trust}
                    </span>
                    {credential.fills.length > 0 && (
                      <span className="text-[13px] text-muted-foreground">
                        {copy.fills.replace(
                          "{fields}",
                          credential.fills.join(", "),
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}
