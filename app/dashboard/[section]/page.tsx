import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/app/components/ui/button";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { fetchPage } from "@/app/lib/directory";
import { isSection } from "@/app/lib/directory-types";
import { formatCount } from "@/app/lib/plural";
import { InfiniteList } from "./InfiniteList";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]">): Promise<Metadata> {
  const { section } = await params;
  if (!isSection(section)) return {};
  return { title: (await getI18n()).t.dashboard.sections[section].title };
}

/** A tenant's issuers, verifiers or identities: the first page, then scrolling. */
export default async function SectionPage({
  params,
}: PageProps<"/dashboard/[section]">) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const { locale, t } = await getI18n();
  const copy = t.dashboard.sections[section];
  const page = await fetchPage(section);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
          <p className="text-muted-foreground">
            {page && page.total > 0
              ? formatCount(copy.total, page.total, locale)
              : copy.lead}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${section}/new`}>
            <PlusIcon />
            {copy.create}
          </Link>
        </Button>
      </header>

      <InfiniteList
        key={section}
        section={section}
        initial={page}
        locale={locale}
        timeZone={await getTimeZone()}
      />
    </div>
  );
}
