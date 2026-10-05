"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WalletQr } from "@/app/components/WalletQr";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { useI18n } from "@/app/i18n/client";
import {
  pollWallet,
  startWallet,
  type SignTarget,
  type WalletPurpose,
  type WalletStart,
} from "@/app/lib/wallet-actions";

type Shown = Extract<WalletStart, { ok: true }>;

/**
 * A request to the Almena wallet: the QR code a phone scans, the deep link
 * that opens the wallet on this device, and the wait for its answer. The page
 * asks every two seconds; the code lasts five minutes, then a new one is offered.
 */
export function WalletRequest({
  purpose,
  target,
}: {
  purpose: WalletPurpose;
  /** `sign`: the identity, and where to go back to once signed. */
  target?: SignTarget;
}) {
  const { t } = useI18n();
  const copy = t.wallet;
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
    const answer = await startWallet(purpose, target);
    if (!answer.ok) {
      setShown(null);
      setError(answer.error);
      setState("failed");
      return;
    }
    setShown(answer);
    // The target is a plain value from the server: its fields say whether it changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    purpose,
    target?.kind,
    target && "id" in target ? target.id : null,
    target && "issuer" in target ? target.issuer : null,
    target && "status" in target ? target.status : null,
    target?.back,
  ]);

  useEffect(() => {
    // Once per visit, not once per render in development's double effects.
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
      const result = await pollWallet();
      if (stop) return;
      if (result.status === "done") {
        stop = true;
        // A full load: the header and menus read the new session.
        window.location.assign(result.to);
      } else if (result.status === "expired") setState("expired");
      else if (result.status === "failed") setState("failed");
    }, 2000);
    return () => {
      stop = true;
      clearInterval(tick);
      clearInterval(ask);
    };
  }, [shown, state]);

  const time =
    left === null
      ? ""
      : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="grid gap-3.5">
      {state === "failed" && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {(error && copy.errors[error as keyof typeof copy.errors]) ||
              copy.failed}
          </AlertDescription>
        </Alert>
      )}
      {shown && state === "waiting" ? (
        <WalletQr
          qr={shown.qr}
          deepLink={shown.deepLink}
          label={copy.qr}
          open={copy.open}
          status={
            <>
              {copy.waiting}
              {time && ` ${copy.expiresIn.replace("{time}", time)}`}
            </>
          }
        />
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
