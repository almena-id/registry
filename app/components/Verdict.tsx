"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { useI18n } from "@/app/i18n/client";
import type { VerifiedCredential } from "@/app/lib/verify-actions";

/** A value as the result shows it: text as it is, anything else as JSON. */
const shown = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value);

/**
 * The API's verdict on what a wallet presented for a form — pasted on the
 * form's Verify tab, or answered to a verifier's QR: whether it holds, and
 * credential by credential its issuer and format, the claims disclosed, the
 * fields they fill, or what went wrong.
 */
export function Verdict({
  result,
}: {
  result: { verified: boolean; credentials: VerifiedCredential[] };
}) {
  const { t } = useI18n();
  const copy = t.dashboard.forms.detail;
  const problem = (code: string) =>
    copy.problems[code as keyof typeof copy.problems] ?? code;
  return (
    <Card className="gap-3 p-5" aria-live="polite">
      <h2 className="flex items-center gap-2 font-semibold">
        {result.verified ? (
          <CheckCircle2Icon className="size-5 text-primary" />
        ) : (
          <XCircleIcon className="size-5 text-destructive" />
        )}
        {result.verified ? copy.verified : copy.notVerified}
      </h2>
      <ul className="grid gap-3">
        {result.credentials.map((credential) => (
          <li
            key={credential.key}
            className="grid gap-1.5 border-t pt-3 text-sm first:border-t-0 first:pt-0"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold">{credential.key}</span>
              <Badge
                variant={
                  credential.verified
                    ? "brand"
                    : credential.presented
                      ? "danger"
                      : "muted"
                }
              >
                {credential.verified
                  ? copy.credentialVerified
                  : credential.presented
                    ? copy.credentialFailed
                    : copy.credentialMissing}
              </Badge>
              {credential.format && (
                <Badge variant="muted">{credential.format}</Badge>
              )}
            </span>
            {credential.issuer && (
              <span className="font-mono text-[12px] break-all text-muted-foreground">
                {copy.issuer}: {credential.issuer}
              </span>
            )}
            {credential.problems.length > 0 && (
              <ul className="list-disc pl-5 text-destructive">
                {credential.problems.map((code) => (
                  <li key={code}>{problem(code)}</li>
                ))}
              </ul>
            )}
            {Object.keys(credential.claims).length > 0 && (
              <dl className="grid gap-1">
                {Object.entries(credential.claims).map(([name, value]) => (
                  <div key={name} className="flex flex-wrap gap-2">
                    <dt className="font-mono text-muted-foreground">{name}</dt>
                    <dd className="break-all">{shown(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {Object.keys(credential.fills).length > 0 && (
              <span className="text-[13px] text-faint">
                {copy.fills.replace(
                  "{fields}",
                  Object.keys(credential.fills).join(", "),
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
