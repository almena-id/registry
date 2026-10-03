import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchQueue } from "@/app/lib/queues";
import { loadItem } from "../../load";
import { QueueCard } from "./QueueCard";

/**
 * Queue: where an issuer's or verifier's back office reads what happens to
 * it, at the broker. Admins make it — its password is shown that once — and
 * delete it; other members see whether there is one and how it is reached.
 */
export default async function QueueTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/queue">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (
    !loaded ||
    (loaded.section !== "issuers" && loaded.section !== "verifiers")
  )
    notFound();
  if (!loaded.item) return null;
  const [{ t }, queue, tenant, timeZone] = await Promise.all([
    getI18n(),
    fetchQueue(loaded.section, id),
    currentTenant(),
    getTimeZone(),
  ]);
  if (!queue)
    return (
      <Card className="min-w-0 gap-0 p-5">
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t.dashboard.queue.errors.unavailable}
          </AlertDescription>
        </Alert>
      </Card>
    );
  return (
    <QueueCard
      section={loaded.section}
      id={id}
      queue={queue}
      admin={tenant?.role === "admin"}
      timeZone={timeZone}
    />
  );
}
