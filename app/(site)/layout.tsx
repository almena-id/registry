import { SiteHeader } from "@/app/components/SiteHeader";
import { getI18n } from "@/app/i18n/server";

/** The public pages: landing and sign-in. */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  return (
    <>
      <SiteHeader t={t} />
      <main className="shell__main">{children}</main>
    </>
  );
}
