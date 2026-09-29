import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { AddDomainForm } from "../Domains";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: `${t.dashboard.tenant.title} · ${t.dashboard.domains.add}`,
  };
}

/** Only an admin links a domain; anybody else goes back to the list. */
export default async function AddDomainPage() {
  if ((await currentTenant())?.role !== "admin")
    redirect("/dashboard/tenant/domains");
  return <AddDomainForm />;
}
