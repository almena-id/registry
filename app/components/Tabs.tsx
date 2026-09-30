"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs as Root, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

/**
 * A horizontal menu of a screen's sections, one link each; the one whose
 * address is the page's, or holds it (`/domains` for `/domains/new`), is
 * marked current. Every screen with sections uses
 * this one shape: shadcn's line tabs, each trigger a link, since each
 * section is a page of its own.
 */
export function Tabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  // The longest match: `/dashboard/tenant` holds every tab's address.
  const current = tabs
    .map(({ href }) => href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return (
    <Root value={current} activationMode="manual" className="min-w-0 border-b">
      <TabsList
        variant="line"
        aria-label={label}
        className="max-w-full justify-start overflow-x-auto [scrollbar-width:none]"
      >
        {tabs.map(({ href, label: text }) => (
          <TabsTrigger
            key={href}
            value={href}
            asChild
            className="flex-none px-3 data-[state=active]:text-primary after:bg-primary"
          >
            <Link href={href} aria-current={href === current ? "page" : undefined}>
              {text}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Root>
  );
}
