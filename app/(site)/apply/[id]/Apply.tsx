"use client";

import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { useI18n } from "@/app/i18n/client";
import { saveApplicationAnswers } from "@/app/lib/application-actions";
import type { FileMeta, HolderApplication } from "@/app/lib/applications";
import { label, type Labels } from "@/app/lib/form-fields";
import { hasText } from "@/app/lib/texts";
import { ApplicationWallet } from "./ApplicationWallet";
import { FieldInput, type Domains } from "@/app/components/FieldInput";

/** A value from a credential as a person reads it. */
function shownValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(shownValue).join(", ");
  if (value && typeof value === "object")
    return Object.values(value).map(shownValue).join(", ");
  return String(value ?? "");
}

/** One numbered step of the application. */
function Step({
  number,
  title,
  done,
  children,
}: {
  number: number;
  title: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="gap-4 p-6">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold">
        <span
          className="grid size-7 place-items-center rounded-full bg-brand-soft text-[13px] text-primary"
          aria-hidden
        >
          {done ? <CheckCircle2Icon className="size-4" /> : number}
        </span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

/**
 * Applying for a credential, as the holder goes: pair the wallet (QR 1); fill
 * in the form — presenting the credentials it asks for, which fill their
 * fields verified, typing the rest and uploading files; then sign and send it
 * from the wallet (QR 2). The page follows the application's status; each
 * wallet answer reloads it from the registry.
 */
export function Apply({
  application,
  domains,
  types,
}: {
  application: HolderApplication;
  domains: Domains;
  /** Credential types' names, by id. */
  types: Record<string, Labels>;
}) {
  const { t, locale } = useI18n();
  const copy = t.apply;
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  const { offer, status } = application;
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    application.answers,
  );
  const [files, setFiles] = useState<Record<string, FileMeta>>(
    application.files,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const typeName = label(offer.credential_type.labels, locale);

  if (status !== "open" && status !== "paired")
    return (
      <Card className="gap-3 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2Icon className="size-5 text-primary" />
          {copy.status[status]}
        </h2>
        <p className="text-muted-foreground">
          {copy.statusLead[status]
            .replace("{issuer}", offer.issuer.name)
            .replace("{type}", typeName)}
        </p>
        {application.decision_note && (
          <p className="rounded-lg bg-sunk px-3.5 py-3 text-sm">
            {application.decision_note}
          </p>
        )}
        {status === "issued" &&
          (application.delivered_at ? (
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheckIcon className="size-4 text-primary" />
              {copy.inWallet}
            </p>
          ) : (
            <div className="grid gap-3">
              <h3 className="font-semibold">{copy.receiveTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {copy.receiveLead}
              </p>
              <ApplicationWallet
                id={application.id}
                purpose="receive"
                onAnswered={refresh}
              />
            </div>
          ))}
        <p className="font-mono text-[12px] text-faint">{application.slug}</p>
      </Card>
    );

  const presented = new Map(application.presented.map((p) => [p.key, p]));
  const filled = application.filled;
  // A field's errors by part: "" for its own, the part's key for a group's.
  const errorsOf = (key: string) => {
    const own: Record<string, string> = {};
    for (const [name, code] of Object.entries(errors)) {
      if (name === key) own[""] = code;
      else if (name.startsWith(`${key}.`))
        own[name.slice(key.length + 1)] = code;
    }
    return Object.keys(own).length ? own : undefined;
  };

  const save = async () => {
    setSaving(true);
    setFailure(null);
    const result = await saveApplicationAnswers(application.id, answers);
    setSaving(false);
    if (result.ok) {
      setErrors({});
      setSubmitting(true);
    } else {
      setErrors(result.errors);
      setFailure(
        Object.keys(result.errors).length
          ? "answers_invalid"
          : (result.error ?? "unavailable"),
      );
    }
  };

  return (
    <div className="grid gap-5">
      <Step number={1} title={copy.pairTitle} done={status === "paired"}>
        {status === "open" ? (
          <>
            <p className="text-muted-foreground">
              {copy.pairLead.replace("{issuer}", offer.issuer.name)}
            </p>
            <ApplicationWallet
              id={application.id}
              purpose="pair"
              onAnswered={refresh}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {copy.paired}{" "}
            <span className="font-mono text-[12px] break-all text-faint">
              {application.holder_did}
            </span>
          </p>
        )}
      </Step>

      {status === "paired" && !submitting && (
        <Step number={2} title={copy.fillTitle}>
          {offer.form.credentials.length > 0 && (
            <section className="grid gap-3" aria-labelledby="present-title">
              <div>
                <h3 id="present-title" className="font-semibold">
                  {copy.credentialsTitle}
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  {copy.credentialsLead}
                </p>
              </div>
              <ul className="grid gap-2">
                {offer.form.credentials.map((request) => {
                  const result = presented.get(request.key);
                  return (
                    <li
                      key={request.key}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3.5 py-3"
                    >
                      <span className="grid gap-0.5">
                        <span className="font-medium">
                          {types[request.type]
                            ? label(types[request.type], locale)
                            : request.type}{" "}
                          {!request.required && (
                            <span className="text-[13px] font-normal text-muted-foreground">
                              {copy.optional}
                            </span>
                          )}
                        </span>
                        {request.purpose && hasText(request.purpose) && (
                          <span className="text-[13px] text-muted-foreground">
                            {label(request.purpose, locale)}
                          </span>
                        )}
                        {result?.presented && !result.verified && (
                          <span className="text-[13px] text-destructive">
                            {result.problems
                              .map(
                                (code) =>
                                  copy.presentation[
                                    code as keyof typeof copy.presentation
                                  ] ?? code,
                              )
                              .join(" ")}
                          </span>
                        )}
                      </span>
                      {result?.verified ? (
                        <Badge variant="brand">
                          <ShieldCheckIcon />
                          {copy.verified}
                        </Badge>
                      ) : (
                        <Badge variant={request.required ? "pending" : "muted"}>
                          {request.required ? copy.needed : copy.notPresented}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
              {presenting ? (
                <ApplicationWallet
                  id={application.id}
                  purpose="present"
                  onAnswered={() => {
                    setPresenting(false);
                    refresh();
                  }}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="justify-self-start"
                  onClick={() => setPresenting(true)}
                >
                  <ShieldCheckIcon />
                  {copy.present}
                </Button>
              )}
            </section>
          )}

          <section className="grid gap-4" aria-labelledby="fields-title">
            <h3 id="fields-title" className="font-semibold">
              {copy.fieldsTitle}
            </h3>
            {offer.form.fields.map((field) =>
              field.key in filled ? (
                <div
                  key={field.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sunk px-3.5 py-2.5"
                >
                  <span className="grid gap-0.5">
                    <span className="text-[13px] text-muted-foreground">
                      {label(field.field.labels, locale)}
                    </span>
                    <span className="font-medium">
                      {shownValue(filled[field.key])}
                    </span>
                  </span>
                  <Badge variant="brand">
                    <ShieldCheckIcon />
                    {copy.verified}
                  </Badge>
                </div>
              ) : (
                <FieldInput
                  key={field.key}
                  id={`f-${field.key}`}
                  applicationId={application.id}
                  field={field.field}
                  narrow={field.narrow ?? {}}
                  required={field.required}
                  help={field.help ? label(field.help, locale) : undefined}
                  value={answers[field.key]}
                  onChange={(value) =>
                    setAnswers((all) => ({ ...all, [field.key]: value }))
                  }
                  domains={domains}
                  error={errorsOf(field.key)}
                  file={files[field.key]}
                  onFile={(meta) =>
                    setFiles((all) => {
                      const next = { ...all };
                      if (meta) next[field.key] = meta;
                      else delete next[field.key];
                      return next;
                    })
                  }
                />
              ),
            )}
          </section>

          {failure && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {copy.errors[failure as keyof typeof copy.errors] ??
                  copy.errors.unavailable}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end">
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {copy.continue}
            </Button>
          </div>
        </Step>
      )}

      {status === "paired" && submitting && (
        <Step number={3} title={copy.submitTitle}>
          <p className="text-muted-foreground">
            {copy.submitLead.replace("{issuer}", offer.issuer.name)}
          </p>
          <ApplicationWallet
            id={application.id}
            purpose="submit"
            onAnswered={refresh}
          />
          <Button
            type="button"
            variant="ghost"
            className="justify-self-start"
            onClick={() => setSubmitting(false)}
          >
            {copy.back}
          </Button>
        </Step>
      )}
    </div>
  );
}
