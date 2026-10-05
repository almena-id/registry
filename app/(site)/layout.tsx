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
      <main className="page-frame flex flex-1 flex-col pt-8 pb-12">
        {children}
      </main>
    </>
  );
}
