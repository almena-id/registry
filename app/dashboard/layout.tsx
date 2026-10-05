import { redirect } from "next/navigation";

import { SiteHeader } from "@/app/components/SiteHeader";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant, currentTenants, currentUser } from "@/app/lib/api";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { t } = await getI18n();
  const tenant = await currentTenant();

  return (
    <>
      <SiteHeader
        t={t}
        timeZone={await getTimeZone()}
        account={user.email ?? user.alias ?? t.header.account.label}
        tenants={await currentTenants()}
        tenant={tenant}
      />
      <main className="page-frame flex flex-1 flex-col pt-8 pb-12">
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-6 min-[860px]:grid-cols-[232px_minmax(0,1fr)] min-[860px]:gap-8">
          <aside className="flex flex-col gap-4 min-[860px]:sticky min-[860px]:top-[88px] min-[860px]:self-start">
            <DashboardNav
              anchor={Boolean(tenant?.anchor)}
              anchorAdmin={Boolean(tenant?.anchor && tenant.role === "admin")}
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
