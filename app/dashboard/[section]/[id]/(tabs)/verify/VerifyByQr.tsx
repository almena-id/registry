"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Select } from "@/app/components/Select";
import { Verdict } from "@/app/components/Verdict";
import { WalletQr } from "@/app/components/WalletQr";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { useI18n } from "@/app/i18n/client";
import {
  checkVerification,
  openVerification,
  type Opened,
} from "@/app/lib/verification-actions";
import type { VerifiedCredential } from "@/app/lib/verify-actions";

type Shown = Extract<Opened, { ok: true }>;
type Result = { verified: boolean; credentials: VerifiedCredential[] };

/**
 * Pick a form, show its QR: the wallet that scans it is asked, as this
 * verifier, for what the form asks; every two seconds the registry is asked
 * whether it answered. Answered, the verdict replaces the code; expired, a new
 * one can be shown.
 */
export function VerifyByQr({
  verifierId,
  published,
  forms,
}: {
  verifierId: string;
  published: boolean;
  forms: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  const copy = t.dashboard.verification;
  const [form, setForm] = useState(forms[0]?.id ?? "");
  const [shown, setShown] = useState<Shown | null>(null);
  const [state, setState] = useState<"idle" | "waiting" | "expired">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shown || state !== "waiting") return;
    const timer = setInterval(async () => {
      const seen = await checkVerification(verifierId, shown.id).catch(
        () => null,
      );
      if (!seen) return;
      if (seen.status === "answered" && seen.result) {
        setResult(seen.result);
        setState("idle");
        setShown(null);
      } else if (seen.status === "expired") {
        setState("expired");
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [shown, state, verifierId]);

  async function show() {
    setBusy(true);
    setError(null);
    setResult(null);
    const opened = await openVerification(verifierId, form).catch(
      (): Opened => ({ ok: false, error: "unavailable" }),
    );
    setBusy(false);
    if (!opened.ok) {
      setError(copy.errors[opened.error]);
      return;
    }
    setShown(opened);
    setState("waiting");
  }

  if (!published)
    return (
      <Alert variant="notice" role="status">
        <AlertDescription>{copy.unpublished}</AlertDescription>
      </Alert>
    );
  if (!forms.length)
    return (
      <Card className="gap-2 p-5">
        <p className="text-sm text-muted-foreground">{copy.noForms}</p>
        <Link
          href="/dashboard/forms/new"
          className="text-sm font-medium text-primary hover:underline"
        >
          {copy.createForm}
        </Link>
      </Card>
    );

  return (
    <div className="grid gap-4">
      <Card className="gap-4 p-6">
        <p className="text-sm text-muted-foreground">{copy.lead}</p>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <Field className="min-w-60 flex-1 gap-1.5">
            <FieldLabel htmlFor="verify-form">{copy.form}</FieldLabel>
            <Select
              id="verify-form"
              name="form"
              defaultValue={form}
              onChange={setForm}
              options={forms.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Field>
          <Button type="button" onClick={() => void show()} disabled={busy}>
            {shown ? copy.again : copy.show}
          </Button>
        </div>
        {shown && (
          <div className="border-t pt-4">
            {/* As wide as the QR card of the wallet screens. */}
            <WalletQr
              className="mx-auto max-w-[352px]"
              qr={shown.qr}
              deepLink={shown.deepLink}
              label={copy.qr}
              open={copy.open}
              status={state === "expired" ? copy.expired : copy.waiting}
            />
          </div>
        )}
      </Card>
      {result && <Verdict result={result} />}
    </div>
  );
}
