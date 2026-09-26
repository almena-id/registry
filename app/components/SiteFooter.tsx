import type { Dictionary } from "@/app/i18n/config";
import { Logo } from "./Logo";

export function SiteFooter({ t }: { t: Dictionary }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span className="site-footer__brand">
          <Logo size={18} />
          {t.app.name}
        </span>
        <span className="site-footer__meta">
          © {new Date().getFullYear()} {t.footer.rights} ·{" "}
          <a href="https://almena.network">{t.footer.site}</a>
        </span>
      </div>
    </footer>
  );
}
