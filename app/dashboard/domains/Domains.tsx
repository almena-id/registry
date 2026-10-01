"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { Input } from "@/app/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import {
  addDomain,
  checkDomain,
  removeDomain,
  type DomainState,
} from "@/app/lib/domain-actions";
import type { Domain } from "@/app/lib/domains";

/** A fact of the DNS record: a term and its value, one line each. */
const fact =
  "flex flex-wrap justify-between gap-2 border-t pt-3 text-sm first:border-t-0 first:pt-0";

/**
 * One linked domain, as a list row: its name, whether it is proved and when
 * it was added. Opened, it shows its configuration — the DNS record that
 * proves it — and, for admins, checking for the record and removing it.
 */
export function DomainRow({
  domain,
  added,
  admin,
  open,
}: {
  domain: Domain;
  /** `created_at`, already written in the visitor's locale and zone. */
  added: string;
  admin: boolean;
  /** Opened from the start: the domain just added. */
  open: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.domains;
  const [checked, check, checking] = useActionState<DomainState>(
    () => checkDomain(domain.id),
    {},
  );
  const [removed, remove, removing] = useActionState<DomainState>(
    () => removeDomain(domain.id),
    {},
  );
  const error = checked.error ?? removed.error;

  return (
    <Collapsible asChild defaultOpen={open}>
      <li className="group border-t first:border-t-0">
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent">
          <ChevronRightIcon className="size-4 flex-none text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {domain.domain}
          </span>
          <Badge variant={domain.verified ? "brand" : "pending"}>
            {domain.verified ? copy.verified : copy.notVerified}
          </Badge>
          <time
            className="flex-none text-[13px] text-faint tabular-nums max-sm:hidden"
            dateTime={domain.created_at}
            title={copy.added}
          >
            {added}
          </time>
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-3 px-5 pb-4 pl-12">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
              {copy.record}
            </p>
            <dl className="grid gap-3 rounded-lg bg-sunk px-3.5 py-3">
              <div className={fact}>
                <dt className="text-muted-foreground">{copy.type}</dt>
                <dd className="font-mono text-[13px] break-all">
                  {domain.dns_record.type}
                </dd>
              </div>
              <div className={fact}>
                <dt className="text-muted-foreground">{copy.name}</dt>
                <dd className="font-mono text-[13px] break-all">
                  {domain.dns_record.name}
                </dd>
              </div>
              <div className={fact}>
                <dt className="text-muted-foreground">{copy.value}</dt>
                <dd className="font-mono text-[13px] break-all">
                  {domain.dns_record.value}
                </dd>
              </div>
            </dl>
          </div>
          {(admin || !domain.verified) && (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[13px] text-faint">
                {!domain.verified && copy.recordHint}
              </span>
              {admin && (
                <span className="flex gap-2">
                  <form action={remove} className="contents">
                    <Button
                      variant="danger"
                      size="sm"
                      type="submit"
                      disabled={removing}
                    >
                      {copy.remove}
                    </Button>
                  </form>
                  {!domain.verified && (
                    <form action={check} className="contents">
                      <Button size="sm" type="submit" disabled={checking}>
                        {copy.check}
                      </Button>
                    </form>
                  )}
                </span>
              )}
            </div>
          )}
          {error && !checking && !removing && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{copy.errors[error]}</AlertDescription>
            </Alert>
          )}
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

/** Admins: link another domain; it comes back open, with its record. */
export function AddDomainForm() {
  const { t } = useI18n();
  const copy = t.dashboard.domains;
  const [state, action, pending] = useActionState<DomainState, FormData>(
    addDomain,
    {},
  );

  return (
    <Card className="gap-0 p-6">
      <form className="flex flex-col gap-[18px]" action={action} noValidate>
        <Field
          data-invalid={state.error ? true : undefined}
          className="gap-1.5"
        >
          <FieldLabel htmlFor="domain">{copy.add}</FieldLabel>
          <Input
            id="domain"
            name="domain"
            placeholder="acme.com"
            autoFocus
            defaultValue={state.domain}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "domain-error" : "domain-hint"}
          />
          {state.error ? (
            <FieldError className="text-[13px]" id="domain-error">
              {copy.errors[state.error]}
            </FieldError>
          ) : (
            <FieldDescription
              className="text-[13px] text-faint"
              id="domain-hint"
            >
              {copy.addLead}
            </FieldDescription>
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard/domains">{copy.cancel}</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {copy.addButton}
          </Button>
        </div>
      </form>
    </Card>
  );
}
