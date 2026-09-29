import type { Dictionary } from "@/app/i18n/config";
import type { Theme } from "@/app/lib/theme";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitch } from "./ThemeSwitch";

/** The foot of every page, where the language and the theme are chosen. */
export function SiteFooter({ t, theme }: { t: Dictionary; theme: Theme }) {
  return (
    <footer className="border-t text-sm text-muted-foreground">
      <div className="page-frame flex flex-wrap items-center justify-between gap-4 py-5">
        <span className="inline-flex items-center gap-2 text-foreground">
          <Logo size={18} />
          {t.app.name}
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>
            © {new Date().getFullYear()} {t.footer.rights} ·{" "}
            <a href="https://almena.network" className="hover:text-foreground hover:underline">
              {t.footer.site}
            </a>
          </span>
          <div className="flex gap-1">
            <LanguageSwitcher placement="above" />
            <ThemeSwitch initial={theme} placement="above" />
          </div>
        </div>
      </div>
    </footer>
  );
}
