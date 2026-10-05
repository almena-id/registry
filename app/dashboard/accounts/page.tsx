import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronRightIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/format";
import { formatCount } from "@/app/lib/plural";
import { fetchAccounts } from "@/app/lib/subscriptions";
import { StatusBadge } from "./StatusBadge";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.accounts.title };
}

/**
 * The trust anchor's admins: every other account, newest first, with its
 * subscription — searched by a part of its name (or its slug) and narrowed to
 * those with or without one, a page at a time. Each opens to set it.
 */
export default async function AccountsPage({
  searchParams,
}: PageProps<"/dashboard/accounts">) {
  const tenant = await currentTenant();
  if (!tenant?.anchor || tenant.role !== "admin") notFound();
  const params = await searchParams;
  const one = (name: string) => {
    const value = params[name];
    return typeof value === "string" ? value : undefined;
  };
  const q = one("q") ?? "";
  const subscribed =
    one("subscribed") === "yes" || one("subscribed") === "no"
      ? (one("subscribed") as "yes" | "no")
      : undefined;
  const [{ t, locale }, page, timeZone] = await Promise.all([
    getI18n(),
    fetchAccounts({ q, subscribed, cursor: one("cursor") }),
    getTimeZone(),
  ]);
  const copy = t.dashboard.accounts;
  const filters = (more: Record<string, string>) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (subscribed) query.set("subscribed", subscribed);
    for (const [key, value] of Object.entries(more)) query.set(key, value);
    const text = query.toString();
    return `/dashboard/accounts${text ? `?${text}` : ""}`;
  };

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.lead}</p>
      </header>

      <form className="flex flex-wrap items-center gap-2" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder={copy.search}
          aria-label={copy.search}
          maxLength={100}
          className="max-w-xs"
        />
        <nav className="flex gap-1" aria-label={copy.filter}>
          {(
            [
              [undefined, copy.all],
              ["yes", copy.subscribed],
              ["no", copy.unsubscribed],
            ] as const
          ).map(([value, text]) => (
            <Button
              key={text}
              asChild
              size="sm"
              variant={subscribed === value ? "secondary" : "ghost"}
            >
              <Link
                href={(() => {
                  const query = new URLSearchParams();
                  if (q) query.set("q", q);
                  if (value) query.set("subscribed", value);
                  const text = query.toString();
                  return `/dashboard/accounts${text ? `?${text}` : ""}`;
                })()}
              >
                {text}
              </Link>
            </Button>
          ))}
        </nav>
        {subscribed && (
          <input type="hidden" name="subscribed" value={subscribed} />
        )}
        <Button type="submit" size="sm" variant="outline">
          {copy.searchButton}
        </Button>
      </form>

      {page === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t.dashboard.billing.unavailable}</AlertDescription>
        </Alert>
      ) : (
        <Card className="gap-0 py-0">
          {page.items.length === 0 ? (
            <p className="px-5 py-8 text-center text-faint">{copy.empty}</p>
          ) : (
            <ul>
              {page.items.map((account) => (
                <li key={account.id} className="border-t first:border-t-0">
                  <Link
                    href={`/dashboard/accounts/${account.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {account.name ?? account.slug}
                      </span>
                      <span className="block text-[13px] text-muted-foreground">
                        <span className="font-mono text-[12px]">
                          {account.slug}
                        </span>
                        {" · "}
                        {formatCount(copy.members, account.members, locale)}
                        {" · "}
                        {copy.since.replace(
                          "{date}",
                          formatDateTime(account.created_at, locale, timeZone),
                        )}
                      </span>
                    </span>
                    <StatusBadge
                      subscription={account.subscription}
                      copy={t.dashboard.billing}
                    />
                    <ChevronRightIcon className="size-4 flex-none text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {(one("cursor") || page?.next_cursor) && (
        <div className="flex justify-end gap-2">
          {one("cursor") && (
            <Button asChild variant="ghost" size="sm">
              <Link href={filters({})}>{copy.firstPage}</Link>
            </Button>
          )}
          {page?.next_cursor && (
            <Button asChild variant="outline" size="sm">
              <Link href={filters({ cursor: page.next_cursor })}>
                {copy.nextPage}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
