import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { getI18n } from "@/app/i18n/server";

type Section =
  | "issuers"
  | "verifiers"
  | "mediators"
  | "identities"
  | "forms"
  | "catalogue"
  | "domains"
  | "users";

/**
 * The head of every create screen: the breadcrumb — the overview, the
 * section's list (named as the side menu names it), this screen — then the
 * title and its lead.
 */
export async function CreateHeader({
  section,
  title,
  lead,
}: {
  section: Section;
  title: string;
  lead: string;
}) {
  const { t } = await getI18n();
  const nav = t.dashboard.nav;

  return (
    <header className="mb-6 grid gap-3">
      <Breadcrumb aria-label={nav.breadcrumb}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{nav.overview}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/${section}`}>{nav[section]}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{lead}</p>
      </div>
    </header>
  );
}
