import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchIdentity } from "@/app/lib/directory";
import { fetchTenant } from "@/app/lib/tenant";
import { DidDocuments } from "../../[section]/[id]/Detail";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.dashboard.tenant.title} · ${t.dashboard.detail.json}` };
}

/** JSON: the tenant's own DID document — published, to sign, or both. */
export default async function TenantJsonPage() {
  const { t } = await getI18n();
  const tenant = await fetchTenant();
  const identity = tenant?.identity
    ? await fetchIdentity(tenant.identity.id)
    : null;
  if (!identity)
    return (
      <Card className="gap-0 px-5 py-10 text-center">
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t.dashboard.tenant.errors.unavailable}
          </AlertDescription>
        </Alert>
      </Card>
    );
  return <DidDocuments item={identity} copy={t.dashboard.json} />;
}
