import Link from "next/link";

import type { Dictionary } from "@/app/i18n/config";
import type { Theme } from "@/app/lib/theme";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitch } from "./ThemeSwitch";
import { TimeZoneSelector } from "./TimeZoneSelector";

/**
 * The bar across the top. Signed in, it also carries the time zone every date
 * is shown in (`timeZone`); public pages have no dates to show.
 */
export function SiteHeader({
  t,
  theme,
  timeZone,
}: {
  t: Dictionary;
  theme: Theme;
  timeZone?: string;
}) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label={t.app.name}>
          <Logo size={28} />
          <span className="brand__name">
            Almena <strong>Registry</strong>
          </span>
        </Link>
        <div className="site-header__controls">
          {timeZone && <TimeZoneSelector timeZone={timeZone} />}
          <LanguageSwitcher />
          <ThemeSwitch initial={theme} />
        </div>
      </div>
    </header>
  );
}
