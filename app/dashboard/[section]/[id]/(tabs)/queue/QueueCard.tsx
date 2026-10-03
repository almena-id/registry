"use client";

import { useActionState, useState } from "react";

import { CopyButton } from "@/app/components/CopyButton";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { useI18n } from "@/app/i18n/client";
import { formatDateTime } from "@/app/lib/format";
import {
  createQueue,
  deleteQueue,
  type QueueState,
} from "@/app/lib/queue-actions";
import type { Queue } from "@/app/lib/queues";

/** One fact: its name on the left, its value on the right. */
const FACT =
  "flex flex-wrap justify-between gap-2 border-t pt-3 text-sm first:border-t-0 first:pt-0";

/**
 * The queue and how its back office connects: the AMQP address, the virtual
 * host, the user and the queue. Its password shows once, right after it is
 * made; deleting it asks first, since what is in it goes too.
 */
export function QueueCard({
  section,
  id,
  queue,
  admin,
  timeZone,
}: {
  section: "issuers" | "verifiers";
  id: string;
  queue: Queue;
  admin: boolean;
  timeZone: string;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.queue;
  const [made, make, making] = useActionState<QueueState, FormData>(
    createQueue.bind(null, section, id),
    { queue },
  );
  const [removed, remove, removing] = useActionState<QueueState, FormData>(
    deleteQueue.bind(null, section, id),
    { queue },
  );
  const [asking, setAsking] = useState(false);
  // The latest answer wins: making it after deleting it, or the other way.
  const [latest, setLatest] = useState<"made" | "removed" | null>(null);
  const state =
    latest === "removed" ? removed : latest === "made" ? made : { queue };
  const current = state.queue ?? queue;
  const error = state.error;

  return (
    <Card className="min-w-0 gap-4 p-5">
      <p className="text-sm text-muted-foreground">
        {section === "issuers" ? copy.leadIssuer : copy.leadVerifier}
      </p>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{copy.errors[error]}</AlertDescription>
        </Alert>
      )}
      {latest === "made" && made.password && (
        <Alert variant="notice" role="status">
          <AlertDescription className="grid gap-2">
            <span>{copy.passwordOnce}</span>
            <span className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-sunk px-2 py-1 font-mono text-[13px] break-all">
                {made.password}
              </code>
              <CopyButton
                text={made.password}
                label={copy.copy}
                done={copy.copied}
              />
            </span>
          </AlertDescription>
        </Alert>
      )}
      <dl className="grid gap-3">
        <div className={FACT}>
          <dt className="text-muted-foreground">{copy.queue}</dt>
          {current.queue ? (
            <dd className="font-mono text-[13px]">{current.queue}</dd>
          ) : (
            <dd className="text-faint">{copy.none}</dd>
          )}
        </div>
        <div className={FACT}>
          <dt className="text-muted-foreground">{copy.user}</dt>
          <dd className="font-mono text-[13px]">{current.user}</dd>
        </div>
        <div className={FACT}>
          <dt className="text-muted-foreground">{copy.address}</dt>
          <dd className="font-mono text-[13px] break-all">
            {current.amqp_url}
          </dd>
        </div>
        <div className={FACT}>
          <dt className="text-muted-foreground">{copy.vhost}</dt>
          <dd className="font-mono text-[13px]">{current.vhost}</dd>
        </div>
        {current.created_at && (
          <div className={FACT}>
            <dt className="text-muted-foreground">{copy.created}</dt>
            <dd>{formatDateTime(current.created_at, locale, timeZone)}</dd>
          </div>
        )}
      </dl>
      {admin && !current.queue && (
        <form action={make} onSubmit={() => setLatest("made")}>
          <Button type="submit" disabled={making}>
            {copy.create}
          </Button>
        </form>
      )}
      {admin && current.queue && !asking && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAsking(true)}
          >
            {copy.delete}
          </Button>
        </div>
      )}
      {admin && current.queue && asking && (
        <form
          action={remove}
          onSubmit={() => {
            setLatest("removed");
            setAsking(false);
          }}
          className="grid gap-2"
        >
          <p className="text-sm">{copy.deleteAsk}</p>
          <span className="flex gap-2">
            <Button type="submit" variant="danger" disabled={removing}>
              {copy.deleteConfirm}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAsking(false)}
            >
              {copy.cancel}
            </Button>
          </span>
        </form>
      )}
    </Card>
  );
}
