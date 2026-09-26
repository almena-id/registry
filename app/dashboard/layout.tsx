import { redirect } from "next/navigation";

import { SiteHeader } from "@/app/components/SiteHeader";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { logout } from "@/app/lib/auth-actions";
import { getTheme } from "@/app/lib/theme-server";
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
        theme={await getTheme()}
        timeZone={await getTimeZone()}
      />
      <main className="shell__main">
        <div className="dashboard">
          <aside className="dashboard__side">
            <DashboardNav />
            <div className="dashboard__user">
              <span className="avatar" aria-hidden="true">
                {user.email.slice(0, 1).toUpperCase()}
              </span>
              <span className="dashboard__email" title={user.email}>
                {user.email}
              </span>
              <form action={logout}>
                <button
                  className="button button--ghost button--small"
                  type="submit"
                >
                  {t.dashboard.signOut}
                </button>
              </form>
            </div>
          </aside>
          <div className="dashboard__content">{children}</div>
        </div>
      </main>
    </>
  );
}
