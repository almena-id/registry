import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchDomains } from "@/app/lib/domains";
import { formatDateTime } from "@/app/lib/format";
import { DomainRow } from "./Domains";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.dashboard.domains.title,
  };
}

/**
 * Domains: the ones linked to the tenant, each proved by a DNS TXT record;
 * verified, they go into its DID document (which then asks to be signed).
 * A list like every other — "Add" above it on the right, the frame drawn even
 * when empty — whose rows open to show each domain's record. Admins add,
 * check and remove; members read. `?open=` opens one: the domain just added.
 */
export default async function DomainsPage({
  searchParams,
}: PageProps<"/dashboard/domains">) {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.domains;
  const [domains, tenant, timeZone, query] = await Promise.all([
    fetchDomains(),
    currentTenant(),
    getTimeZone(),
    searchParams,
  ]);
  const admin = tenant?.role === "admin";
  const open = typeof query.open === "string" ? query.open : null;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.hint}</p>
        </div>
        {admin && (
          <Button asChild>
            <Link href="/dashboard/domains/new">
              <PlusIcon />
              {copy.addButton}
            </Link>
          </Button>
        )}
      </header>

      <Card className="gap-0 py-0">
        {domains === null ? (
          <div className="px-5 py-10">
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {t.dashboard.tenant.errors.unavailable}
              </AlertDescription>
            </Alert>
          </div>
        ) : domains.length === 0 ? (
          <p className="px-5 py-10 text-center text-faint">{copy.empty}</p>
        ) : (
          <ul>
            {domains.map((domain) => (
              <DomainRow
                key={domain.id}
                domain={domain}
                added={formatDateTime(domain.created_at, locale, timeZone)}
                admin={admin}
                open={domain.id === open}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
