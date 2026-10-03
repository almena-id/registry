"use client";

import Link from "next/link";

import { Select } from "@/app/components/Select";
import { Input } from "@/app/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";

/**
 * Where a mediator listens: `https://{subdomain}.{domain}`, the domain one of
 * the tenant's verified `domains`. Travels as `subdomain` and `domain`, as
 * when it is registered and when it moves. `hint` replaces the usual one.
 */
export function AddressField({
  domains,
  subdomain,
  domain,
  error,
  round,
  hint,
}: {
  domains: { id: string; domain: string }[];
  subdomain?: string;
  domain?: string;
  error: string | null;
  round: number;
  hint?: string;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.items;
  // With no verified domain yet, the way to verify one.
  const addDomain = (
    <Link
      href="/dashboard/domains"
      className="font-medium underline underline-offset-4"
    >
      {copy.addDomain}
    </Link>
  );
  const describedBy = error ? "address-error" : "address-hint";

  return (
    <Field data-invalid={error ? true : undefined} className="gap-1.5">
      <FieldLabel htmlFor="subdomain">{copy.url}</FieldLabel>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-sm">
        <span className="text-faint">https://</span>
        <Input
          id="subdomain"
          name="subdomain"
          maxLength={200}
          required
          autoCapitalize="none"
          spellCheck={false}
          placeholder="mediator"
          className="min-w-0 flex-1 basis-32 font-mono"
          defaultValue={subdomain}
          aria-label={copy.subdomain}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <span className="text-faint">.</span>
        <div className="min-w-0 flex-1 basis-40">
          <Select
            key={round}
            id="domain"
            name="domain"
            defaultValue={domain ?? domains[0]?.id ?? ""}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            options={domains.map((d) => ({ value: d.id, label: d.domain }))}
          />
        </div>
      </div>
      {error ? (
        <FieldError className="text-[13px]" id="address-error">
          {error} {domains.length === 0 && addDomain}
        </FieldError>
      ) : (
        <FieldDescription className="text-[13px] text-faint" id="address-hint">
          {hint ?? (domains.length > 0 ? copy.addressHint : copy.noDomains)}{" "}
          {domains.length === 0 && addDomain}
        </FieldDescription>
      )}
    </Field>
  );
}
