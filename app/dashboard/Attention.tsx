import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchPending } from "@/app/lib/pending";
import { PendingRows } from "./PendingRows";

/** How many waiting things are named before "and N more". */
const SHOWN = 5;

/**
 * What waits for somebody in this tenant: the first of what Pending lists
 * (`/dashboard/pending`), the rest a link away. Drawn even when nothing
 * does.
 */
export async function Attention() {
  const { t } = await getI18n();
  const rows = await fetchPending();

  return (
    <Card className="mb-4 gap-0 px-6 py-5">
      <section>
        <h2 className="mb-1 text-[15px] font-semibold">
          {t.dashboard.attention.title}
        </h2>
        {rows === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t.dashboard.items.errors.unavailable}
            </AlertDescription>
          </Alert>
        ) : (
          <PendingRows rows={rows} back="/dashboard" limit={SHOWN} />
        )}
      </section>
    </Card>
  );
}
