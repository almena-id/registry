import { Badge } from "@/app/components/ui/badge";
import type { Dictionary } from "@/app/i18n/config";
import type { Subscription } from "@/app/lib/subscriptions";

/** Where an account's subscription stands, as a tag. */
export function StatusBadge({
  subscription,
  copy,
}: {
  subscription: Subscription;
  copy: Dictionary["dashboard"]["billing"];
}) {
  const { status, in_force } = subscription;
  if (!status) return <Badge variant="muted">{copy.freeBadge}</Badge>;
  if (!in_force) return <Badge variant="muted">{copy.lapsed}</Badge>;
  return (
    <Badge variant={status === "active" ? "brand" : "pending"}>
      {copy.statuses[status]}
    </Badge>
  );
}
