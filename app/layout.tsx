import type { Metadata } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "./components/SiteFooter";
import { TooltipProvider } from "./components/ui/tooltip";
import { I18nProvider } from "./i18n/client";
import { getI18n } from "./i18n/server";
import { getTheme } from "./lib/theme-server";
import "./globals.css";

// The typefaces, self-hosted by next/font (downloaded when building, never
// from Google by the visitor): Chakra Petch for the brand and the headings,
// Inter for the interface, JetBrains Mono for DIDs, URLs, digests and codes.
// globals.css turns their variables into font-brand, font-sans and font-mono.
const brand = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-chakra-petch" });
const ui = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_REGISTRY_WEB_URL ?? "https://registry.almena.id",
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
    <html lang={locale} data-theme={theme} className={`${brand.variable} ${ui.variable} ${mono.variable}`}>
      <body>
        <I18nProvider locale={locale}>
          <TooltipProvider>
            <div className="shell relative isolate flex min-h-dvh flex-col">
              {children}
              <SiteFooter t={t} theme={theme} />
            </div>
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
