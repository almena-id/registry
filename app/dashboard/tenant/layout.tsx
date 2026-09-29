import { getI18n } from "@/app/i18n/server";
import { TenantTabs } from "./TenantTabs";

/** The tenant's screens: its title, the sections menu, and the section. */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  const copy = t.dashboard.tenant;
  return (
    <div className="grid gap-4">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.lead}</p>
      </header>
      <TenantTabs />
      {children}
    </div>
  );
}
