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
  | "catalogue"
  | "tenant"
  | "signing"
  | "domains"
  | "users";

type Label =
  | "activityLabel"
  | "servicesLabel"
  | "templatesLabel"
  | "trustLabel"
  | "tenantLabel";

// The overview on its own, then five titled cards: the activity that arrives
// for the account (the tenant) — the applications its issuers receive; the
// services it publishes and others use; the templates it asks and issues
// with — its forms and the catalogue they are made of; the trust behind its
// DIDs — its identities, the domains they live on and who signs them; then
// the account itself — its settings, billing among them, and its people.
// Most used first.
const groups: {
  label: Label | null;
  entries: { key: Entry; href: string }[];
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
    ],
  },
  {
    label: "templatesLabel",
    entries: [
      { key: "forms", href: "/dashboard/forms" },
      { key: "catalogue", href: "/dashboard/catalogue" },
    ],
  },
  {
    label: "trustLabel",
    entries: [
      { key: "identities", href: "/dashboard/identities" },
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
      {groups.map(({ label, entries }) => {
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
