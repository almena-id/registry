import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlusIcon } from "@/app/components/icons";
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
    <div className="section">
      <header className="page-head page-head--actions">
        <div>
          <h1 className="page-head__title">{copy.title}</h1>
          <p className="page-head__lead">
            {page && page.total > 0
              ? formatCount(copy.total, page.total, locale)
              : copy.lead}
          </p>
        </div>
        <Link
          className="button button--primary"
          href={`/dashboard/${section}/new`}
        >
          <PlusIcon />
          {copy.create}
        </Link>
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
