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
  | "applications"
  | "forms"
  | "fields"
  | "credentialTypes"
  | "valueLists"
  | "fieldCategories"
  | "credentialCategories"
  | "tenant"
  | "signing"
  | "domains"
  | "users"
  | "accounts";

type Label =
  | "activityLabel"
  | "servicesLabel"
  | "templatesLabel"
  | "trustLabel"
  | "tenantLabel";

// The overview on its own, then five titled cards: the activity that arrives
// for the account (the tenant) — the applications its issuers receive; the
// services it publishes and others use, and the identities they act as; the
// templates it asks and issues with — its forms, then what they are made of:
// fields and credential types, and, for the trust anchor, the value lists
// fields draw on and the categories both are filed under; the trust behind its DIDs — the domains they live on and who signs
// them; then the account itself — its settings, billing among them, and its
// people — and, for the trust anchor's admins, every other account and its
// subscription. Most used first.
const groups: {
  label: Label | null;
  entries: { key: Entry; href: string; anchor?: boolean }[];
}[] = [
  { label: null, entries: [{ key: "overview", href: "/dashboard" }] },
  {
    label: "activityLabel",
    entries: [{ key: "applications", href: "/dashboard/applications" }],
  },
  {
    label: "servicesLabel",
    entries: [
      { key: "issuers", href: "/dashboard/issuers" },
      { key: "verifiers", href: "/dashboard/verifiers" },
      { key: "mediators", href: "/dashboard/mediators" },
      { key: "identities", href: "/dashboard/identities" },
    ],
  },
  {
    label: "templatesLabel",
    entries: [
      { key: "forms", href: "/dashboard/forms" },
      { key: "fields", href: "/dashboard/fields" },
      { key: "credentialTypes", href: "/dashboard/credential-types" },
      { key: "valueLists", href: "/dashboard/value-lists", anchor: true },
      {
        key: "fieldCategories",
        href: "/dashboard/categories/fields",
        anchor: true,
      },
      {
        key: "credentialCategories",
        href: "/dashboard/categories/credentials",
        anchor: true,
      },
    ],
  },
  {
    label: "trustLabel",
    entries: [
      { key: "domains", href: "/dashboard/domains" },
      { key: "signing", href: "/dashboard/signing" },
    ],
  },
  {
    label: "tenantLabel",
    entries: [
      { key: "tenant", href: "/dashboard/tenant" },
      { key: "users", href: "/dashboard/users" },
    ],
  },
];

const item =
  "flex items-center justify-between gap-2 rounded-[10px] px-3 py-[9px] text-[15px] whitespace-nowrap";

export function DashboardNav({
  anchor = false,
  anchorAdmin = false,
}: {
  /** The trust anchor's: it keeps the value lists and categories too. */
  anchor?: boolean;
  anchorAdmin?: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  // An entry stays marked on its own screens too (…/new).
  const current = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {groups.map(({ label, entries: all }) => {
        const listed = all.filter((entry) => anchor || !entry.anchor);
        const entries =
          label === "tenantLabel" && anchorAdmin
            ? [
                ...listed,
                { key: "accounts" as const, href: "/dashboard/accounts" },
              ]
            : listed;
        const links = entries.map(({ key, href }) => (
          <Link
            key={key}
            href={href}
            className={`${item} hover:bg-accent aria-[current=page]:bg-brand-soft aria-[current=page]:font-semibold aria-[current=page]:text-primary`}
            aria-current={current(href) ? "page" : undefined}
          >
            {t.dashboard.nav[key]}
          </Link>
        ));
        const card =
          "flex flex-col gap-0.5 rounded-2xl border bg-card p-2 max-[859px]:flex-row max-[859px]:overflow-x-auto";
        if (!label)
          return (
            <nav
              key="overview"
              className={card}
              aria-label={t.dashboard.nav.overview}
            >
              {links}
            </nav>
          );
        // The title shows on the side menu; on narrow screens the cards are
        // rows and go without it.
        const id = `dashboard-nav-${label}`;
        return (
          <div key={label} className="flex flex-col gap-1.5">
            <h2
              id={id}
              className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase max-[859px]:hidden"
            >
              {t.dashboard.nav[label]}
            </h2>
            <nav className={card} aria-labelledby={id}>
              {links}
            </nav>
          </div>
        );
      })}
    </>
  );
}
