"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/app/i18n/client";

type Section = "overview" | "tenants" | "issuers" | "verifiers" | "identities" | "settings";

// Only the overview exists yet; the rest are shown so the shape of the
// portal is visible, and become links as their screens land.
const sections: { key: Section; href?: "/dashboard" }[] = [
  { key: "overview", href: "/dashboard" },
  { key: "tenants" },
  { key: "issuers" },
  { key: "verifiers" },
  { key: "identities" },
  { key: "settings" },
];

export function DashboardNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className="side-nav" aria-label={t.dashboard.nav.label}>
      {sections.map(({ key, href }) =>
        href ? (
          <Link
            key={key}
            href={href}
            className="side-nav__item"
            aria-current={pathname === href ? "page" : undefined}
          >
            {t.dashboard.nav[key]}
          </Link>
        ) : (
          <span key={key} className="side-nav__item" aria-disabled="true">
            {t.dashboard.nav[key]}
            <span className="badge">{t.dashboard.nav.soon}</span>
          </span>
        ),
      )}
    </nav>
  );
}
