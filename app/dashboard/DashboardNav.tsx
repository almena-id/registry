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
  | "signing"
  | "domains"
  | "users";

// Two cards: what the account (the tenant) works with, then the account
// itself — its details, billing among them, its signing, its domains and
// its people.
const groups: { key: Entry; href: string }[][] = [
  [
    { key: "overview", href: "/dashboard" },
    { key: "issuers", href: "/dashboard/issuers" },
    { key: "verifiers", href: "/dashboard/verifiers" },
    { key: "mediators", href: "/dashboard/mediators" },
    { key: "identities", href: "/dashboard/identities" },
  ],
  [
    { key: "tenant", href: "/dashboard/tenant" },
    { key: "signing", href: "/dashboard/signing" },
    { key: "domains", href: "/dashboard/domains" },
    { key: "users", href: "/dashboard/users" },
  ],
];

const labels = ["label", "tenantLabel"] as const;

const item =
  "flex items-center justify-between gap-2 rounded-[10px] px-3 py-[9px] text-[15px] whitespace-nowrap";

export function DashboardNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  // An entry stays marked on its own screens too (…/new).
  const current = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {groups.map((entries, index) => (
        <nav
          key={index}
          className="flex flex-col gap-0.5 rounded-2xl border bg-card p-2 max-[859px]:flex-row max-[859px]:overflow-x-auto"
          aria-label={t.dashboard.nav[labels[index]]}
        >
          {entries.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={`${item} hover:bg-accent aria-[current=page]:bg-brand-soft aria-[current=page]:font-semibold aria-[current=page]:text-primary`}
              aria-current={current(href) ? "page" : undefined}
            >
              {t.dashboard.nav[key]}
            </Link>
          ))}
        </nav>
      ))}
    </>
  );
}
