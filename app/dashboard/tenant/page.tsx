import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchMediatorChoices } from "@/app/lib/directory";
import { fetchTenant } from "@/app/lib/tenant";
import { TenantForm } from "./TenantForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.tenant.title };
}

/** Data: the current tenant's own details: its name and its mediator. (Its signing flow has a tab of its own.) */
export default async function TenantPage() {
  const { t } = await getI18n();
  const copy = t.dashboard.tenant;
  const [tenant, mediators] = await Promise.all([
    fetchTenant(),
    fetchMediatorChoices(),
  ]);

  return tenant ? (
    <TenantForm
      name={tenant.name ?? ""}
      identity={tenant.identity?.name ?? null}
      mediator={tenant.mediator?.id ?? ""}
      mediators={mediators ?? []}
      editable={tenant.role === "admin"}
    />
  ) : (
    <Card className="gap-0 px-5 py-10 text-center">
      <Alert variant="destructive" role="alert">
        <AlertDescription>{copy.errors.unavailable}</AlertDescription>
      </Alert>
    </Card>
  );
}
