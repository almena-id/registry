import type { Metadata } from "next";

import { SiteFooter } from "./components/SiteFooter";
import { I18nProvider } from "./i18n/client";
import { getI18n } from "./i18n/server";
import { getTheme } from "./lib/theme-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_REGISTRY_WEB_URL ?? "https://registry.almena.network",
    ),
    title: { default: t.app.name, template: `%s · ${t.app.name}` },
    description: t.home.lead,
  };
}

/** The document and the footer; each area brings its own header. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getI18n();
  const theme = await getTheme();

  return (
    <html lang={locale} data-theme={theme}>
      <body>
        <I18nProvider locale={locale}>
          <div className="shell">
            {children}
            <SiteFooter t={t} />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
