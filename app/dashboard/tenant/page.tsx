import type { Metadata } from "next";

import { getI18n } from "@/app/i18n/server";
import { fetchTenant } from "@/app/lib/tenant";
import { TenantForm } from "./TenantForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.tenant.title };
}

/** The current tenant's own details: its name and its mediator. */
export default async function TenantPage() {
  const { t } = await getI18n();
  const copy = t.dashboard.tenant;
  const tenant = await fetchTenant();

  return (
    <div className="section">
      <header className="page-head">
        <h1 className="page-head__title">{copy.title}</h1>
        <p className="page-head__lead">{copy.lead}</p>
      </header>
      {tenant ? (
        <TenantForm
          name={tenant.name ?? ""}
          identity={tenant.identity?.name ?? null}
          mediator={tenant.mediator_url ?? ""}
          did={tenant.mediator_did}
          editable={tenant.role === "admin"}
        />
      ) : (
        <div className="card list list--empty">
          <p className="alert" role="alert">
            {copy.errors.unavailable}
          </p>
        </div>
      )}
    </div>
  );
}
