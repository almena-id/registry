import type { Dictionary } from "@/app/i18n/config";
import type { Theme } from "@/app/lib/theme";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitch } from "./ThemeSwitch";

/** The foot of every page, where the language and the theme are chosen. */
export function SiteFooter({ t, theme }: { t: Dictionary; theme: Theme }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span className="site-footer__brand">
          <Logo size={18} />
          {t.app.name}
        </span>
        <div className="site-footer__end">
          <span className="site-footer__meta">
            © {new Date().getFullYear()} {t.footer.rights} ·{" "}
            <a href="https://almena.network">{t.footer.site}</a>
          </span>
          <div className="site-footer__controls">
            <LanguageSwitcher placement="above" />
            <ThemeSwitch initial={theme} placement="above" />
          </div>
        </div>
      </div>
    </footer>
  );
}
