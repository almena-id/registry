"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/app/i18n/client";

type Entry =
  | "overview"
  | "issuers"
  | "verifiers"
  | "mediators"
  | "identities"
  | "tenant"
  | "certification"
  | "billing"
  | "users"
  | "review";

// Two cards: what the tenant works with, then the tenant itself — its
// details, its certification, its billing and its people. Almena's reviewers
// get a third. An entry with no `href` has no screen yet: it is shown, marked
// "Soon", so the shape of the portal is visible.
const groups: { key: Entry; href?: string }[][] = [
  [
    { key: "overview", href: "/dashboard" },
    { key: "issuers", href: "/dashboard/issuers" },
    { key: "verifiers", href: "/dashboard/verifiers" },
    { key: "mediators", href: "/dashboard/mediators" },
    { key: "identities", href: "/dashboard/identities" },
  ],
  [
    { key: "tenant", href: "/dashboard/tenant" },
    { key: "certification", href: "/dashboard/certification" },
    { key: "billing" },
    { key: "users", href: "/dashboard/users" },
  ],
];

const almena: { key: Entry; href?: string }[] = [
  { key: "review", href: "/dashboard/review" },
];

const labels = ["label", "tenantLabel", "almenaLabel"] as const;

export function DashboardNav({ reviewer }: { reviewer: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  // An entry stays marked on its own screens too (…/new).
  const current = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {(reviewer ? [...groups, almena] : groups).map((entries, index) => (
        <nav
          key={index}
          className="side-nav"
          aria-label={t.dashboard.nav[labels[index]]}
        >
          {entries.map(({ key, href }) =>
            href ? (
              <Link
                key={key}
                href={href}
                className="side-nav__item"
                aria-current={current(href) ? "page" : undefined}
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
      ))}
    </>
  );
}
