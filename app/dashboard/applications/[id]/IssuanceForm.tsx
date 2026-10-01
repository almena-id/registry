"use client";

import { useState } from "react";

import { FieldInput, type Domains } from "@/app/components/FieldInput";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import { saveIssuance } from "@/app/lib/application-actions";
import type { IssuanceProposal } from "@/app/lib/applications";

/**
 * The credential's claims, proposed from the application and completed by
 * the issuer, and until when it holds; saved, it goes to its signer's wallet.
 */
export function IssuanceForm({
  id,
  proposal,
  domains,
}: {
  id: string;
  proposal: IssuanceProposal;
  domains: Domains;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.applications;
  const [claims, setClaims] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      proposal.claims
        .filter((claim) => claim.value !== null && claim.value !== undefined)
        .map((claim) => [claim.field.id, claim.value]),
    ),
  );
  const [validUntil, setValidUntil] = useState(proposal.valid_until);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const errorsOf = (key: string) => {
    const own: Record<string, string> = {};
    for (const [name, code] of Object.entries(errors)) {
      if (name === key) own[""] = code;
      else if (name.startsWith(`${key}.`))
        own[name.slice(key.length + 1)] = code;
    }
    return Object.keys(own).length ? own : undefined;
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setFailure(null);
        const result = await saveIssuance(id, claims, validUntil);
        // Saved, the action goes on to the signing screen.
        setPending(false);
        if (!result.ok) {
          setErrors(result.errors);
          setFailure(result.error ?? "unavailable");
        }
      }}
    >
      {proposal.claims.map((claim) => (
        <FieldInput
          key={claim.field.id}
          id={`c-${claim.field.id}`}
          applicationId={id}
          field={claim.field}
          narrow={{}}
          required={claim.required}
          value={claims[claim.field.id]}
          onChange={(value) =>
            setClaims((all) => ({ ...all, [claim.field.id]: value }))
          }
          domains={domains}
          error={errorsOf(claim.field.id)}
        />
      ))}
      <div className="grid max-w-[240px] gap-1.5">
        <FieldLabel htmlFor="valid-until">{copy.validUntil}</FieldLabel>
        <Input
          id="valid-until"
          type="date"
          value={validUntil}
          onChange={(event) => setValidUntil(event.target.value)}
          aria-invalid={failure === "valid_until_invalid" ? true : undefined}
        />
      </div>
      {failure && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {copy.errors[failure as keyof typeof copy.errors] ??
              copy.errors.unavailable}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {copy.toSign}
        </Button>
      </div>
    </form>
  );
}
