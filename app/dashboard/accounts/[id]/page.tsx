import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon } from "lucide-react";

import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/format";
import { formatCount } from "@/app/lib/plural";
import { fetchAccount } from "@/app/lib/subscriptions";
import { StatusBadge } from "../StatusBadge";
import { SubscriptionForm } from "./SubscriptionForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.accounts.title };
}

/**
 * One account, for the trust anchor's admins: who it is and its
 * subscription, set by hand until payments drive them — its status, plan,
 * the day it is paid through (none: open-ended) and a note of the anchor's.
 */
export default async function AccountPage({
  params,
}: PageProps<"/dashboard/accounts/[id]">) {
  const { id } = await params;
  const tenant = await currentTenant();
  if (!tenant?.anchor || tenant.role !== "admin") notFound();
  const [{ t, locale }, account, timeZone] = await Promise.all([
    getI18n(),
    fetchAccount(id),
    getTimeZone(),
  ]);
  if (!account) notFound();
  const copy = t.dashboard.accounts;
  const subscription = account.subscription;

  return (
    <div className="grid gap-6">
      <Link
        href="/dashboard/accounts"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {copy.title}
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {account.name ?? account.slug}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            <span className="font-mono text-[12px]">{account.slug}</span>
            {" · "}
            {formatCount(copy.members, account.members, locale)}
            {" · "}
            {copy.since.replace(
              "{date}",
              formatDateTime(account.created_at, locale, timeZone),
            )}
          </p>
        </div>
        <StatusBadge subscription={subscription} copy={t.dashboard.billing} />
      </header>
      <Card className="gap-0 p-6">
        <SubscriptionForm
          accountId={account.id}
          initial={{
            status: subscription.status ?? "",
            plan: subscription.plan ?? "standard",
            until: subscription.current_period_end
              ? subscription.current_period_end.slice(0, 10)
              : "",
            note: account.note ?? "",
          }}
        />
      </Card>
    </div>
  );
}
