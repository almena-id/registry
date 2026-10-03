import type { Metadata } from "next";
import Link from "next/link";

import { ChevronRightIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { fetchReceived } from "@/app/lib/applications";
import { fetchCredentialCatalogue } from "@/app/lib/credential-catalog";
import { formatDateTime } from "@/app/lib/format";
import { label } from "@/app/lib/form-fields";
import { credentialBadge, statusBadge } from "./status";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.applications.title };
}

/**
 * Applications: what holders signed and sent the account's issuers, newest
 * first, each opening to what it says and the decision.
 */
export default async function ApplicationsPage() {
  const [{ t, locale }, received, credentials, timeZone] = await Promise.all([
    getI18n(),
    fetchReceived(),
    fetchCredentialCatalogue(),
    getTimeZone(),
  ]);
  const copy = t.dashboard.applications;
  const types = new Map(
    credentials?.types.map((type) => [type.id, type.labels]),
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.hint}</p>
      </header>
      <Card className="gap-0 py-0">
        {received === null ? (
          <div className="px-5 py-10">
            <Alert variant="destructive" role="alert">
              <AlertDescription>{copy.errors.unavailable}</AlertDescription>
            </Alert>
          </div>
        ) : received.length === 0 ? (
          <p className="px-5 py-10 text-center text-faint">{copy.empty}</p>
        ) : (
          <ul>
            {received.map((item) => (
              <li key={item.id} className="border-t first:border-t-0">
                <Link
                  href={`/dashboard/applications/${item.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent"
                >
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-semibold">
                      {types.get(item.credential_type)
                        ? label(types.get(item.credential_type)!, locale)
                        : item.credential_type}
                    </span>
                    <span className="truncate text-[13px] text-muted-foreground">
                      {item.issuer.name} · {label(item.form, locale)} ·{" "}
                      <span className="font-mono text-[12px]">{item.slug}</span>
                    </span>
                  </span>
                  <Badge variant={statusBadge[item.status]}>
                    {copy.status[item.status]}
                  </Badge>
                  {item.credential_status &&
                    item.credential_status !== "valid" && (
                      <Badge
                        variant={credentialBadge[item.credential_status]}
                      >
                        {copy.credentialStatuses[item.credential_status]}
                      </Badge>
                    )}
                  {item.submitted_at && (
                    <time
                      className="flex-none text-[13px] text-faint tabular-nums max-sm:hidden"
                      dateTime={item.submitted_at}
                    >
                      {formatDateTime(item.submitted_at, locale, timeZone)}
                    </time>
                  )}
                  <ChevronRightIcon className="size-4 flex-none text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
