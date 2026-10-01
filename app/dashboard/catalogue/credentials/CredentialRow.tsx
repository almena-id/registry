"use client";

import { ChevronRightIcon } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { useI18n } from "@/app/i18n/client";

/** A credential type as the catalogue lists it: everything already worded. */
export type CredentialEntry = {
  id: string;
  label: string;
  description: string;
  source: string;
  /** Issued under a framework of its own: only asked for. */
  external: boolean;
  claims: { label: string; key: string; required: boolean }[];
  /** How each format names it: format, identifier. */
  identifiers: [string, string][];
  /** Its claims' JSON Schema and, for Almena's, its type metadata. */
  links: string[];
};

const fact =
  "flex flex-wrap justify-between gap-x-3 gap-y-1 border-t pt-2 text-sm first:border-t-0 first:pt-0";

/** One credential type, as a list row; opened, its claims and identifiers. */
export function CredentialRow({ type }: { type: CredentialEntry }) {
  const { t } = useI18n();
  const copy = t.dashboard.catalogue;

  return (
    <Collapsible asChild>
      <li className="group border-t first:border-t-0">
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent">
          <ChevronRightIcon className="size-4 flex-none text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-semibold">{type.label}</span>{" "}
            <span className="font-mono text-[12px] text-faint">{type.id}</span>
          </span>
          {type.external && <Badge variant="muted">{copy.external}</Badge>}
          <span className="flex-none text-[13px] text-muted-foreground max-sm:hidden">
            {copy.claimCount.replace("{count}", String(type.claims.length))}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-3 px-5 pb-4 pl-12">
          <p className="text-sm text-muted-foreground">
            {type.description}{" "}
            {t.dashboard.forms.source.replace("{source}", type.source)}
            {type.external && <> {copy.externalHint}</>}
          </p>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
              {copy.claims}
            </p>
            <ul className="grid gap-2 rounded-lg bg-sunk px-3.5 py-3">
              {type.claims.map((claim) => (
                <li key={claim.key} className={fact}>
                  <span>
                    {claim.label}
                    {claim.required && (
                      <span className="text-destructive" title={copy.mandatory}>
                        {" "}
                        *
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[12px] text-faint">
                    {claim.key}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
              {copy.identifiers}
            </p>
            <dl className="grid gap-2 rounded-lg bg-sunk px-3.5 py-3">
              {type.identifiers.map(([format, value]) => (
                <div key={format} className={fact}>
                  <dt className="text-muted-foreground">{format}</dt>
                  <dd className="font-mono text-[12px] break-all">{value}</dd>
                </div>
              ))}
              {type.links.map((link) => (
                <div key={link} className={fact}>
                  <dd>
                    <a
                      href={link}
                      className="font-mono text-[12px] break-all text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}
