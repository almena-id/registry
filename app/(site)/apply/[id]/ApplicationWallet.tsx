"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";
import {
  askWallet,
  pollApplicationWallet,
  type WalletAsk,
} from "@/app/lib/application-actions";

type Shown = Extract<WalletAsk, { ok: true }>;

/**
 * One of the application's requests to the holder's wallet — pair, present,
 * submit or receive the credential: the QR code a phone scans, the deep link for this device, and
 * the wait for its answer (asked every two seconds; five minutes, then a new
 * one is offered). `onAnswered` runs once the wallet has answered.
 */
export function ApplicationWallet({
  id,
  purpose,
  onAnswered,
}: {
  id: string;
  purpose: "pair" | "present" | "submit" | "receive";
  onAnswered: () => void;
}) {
  const { t } = useI18n();
  const copy = t.wallet;
  const errors = t.apply.errors;
  const [shown, setShown] = useState<Shown | null>(null);
  const [state, setState] = useState<"waiting" | "expired" | "failed">(
    "waiting",
  );
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const started = useRef(false);

  const start = useCallback(async () => {
    setState("waiting");
    setError(null);
    const answer = await askWallet(id, purpose);
    if (!answer.ok) {
      setShown(null);
      setError(answer.error);
      setState("failed");
      return;
    }
    setShown(answer);
  }, [id, purpose]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    if (!shown || state !== "waiting") return;
    let stop = false;
    const tick = setInterval(() => {
      const ms = new Date(shown.expiresAt).getTime() - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
    }, 1000);
    const ask = setInterval(async () => {
      const result = await pollApplicationWallet(id);
      if (stop) return;
      if (result === "answered") {
        stop = true;
        onAnswered();
      } else if (result === "expired") setState("expired");
    }, 2000);
    return () => {
      stop = true;
      clearInterval(tick);
      clearInterval(ask);
    };
  }, [shown, state, id, onAnswered]);

  const time =
    left === null
      ? ""
      : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="grid gap-3.5">
      {state === "failed" && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {(error && errors[error as keyof typeof errors]) || copy.failed}
          </AlertDescription>
        </Alert>
      )}
      {shown && state === "waiting" ? (
        <>
          <div
            className="qr mx-auto w-[220px] rounded-xl bg-qr-paper p-2.5"
            role="img"
            aria-label={copy.qr}
            // The SVG comes from the QR library, drawn from the API's link.
            dangerouslySetInnerHTML={{ __html: shown.qr }}
          />
          <Button asChild size="lg" className="w-full">
            <a href={shown.deepLink}>{copy.open}</a>
          </Button>
          <p
            className="text-center text-sm text-muted-foreground"
            role="status"
          >
            {copy.waiting}
            {time && ` ${copy.expiresIn.replace("{time}", time)}`}
          </p>
        </>
      ) : (
        state !== "waiting" && (
          <>
            {state === "expired" && (
              <p className="text-center text-sm text-muted-foreground">
                {copy.expired}
              </p>
            )}
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => void start()}
            >
              {copy.retry}
            </Button>
          </>
        )
      )}
    </div>
  );
}
