import { redirect } from "next/navigation";

import { SiteHeader } from "@/app/components/SiteHeader";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenants, currentUser } from "@/app/lib/api";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { t } = await getI18n();

  return (
    <>
      <SiteHeader
        t={t}
        timeZone={await getTimeZone()}
        email={user.email}
        tenants={await currentTenants()}
      />
      <main className="shell__main">
        <div className="dashboard">
          <aside className="dashboard__side">
            <DashboardNav reviewer={user.reviewer} />
          </aside>
          <div className="dashboard__content">{children}</div>
        </div>
      </main>
    </>
  );
}
