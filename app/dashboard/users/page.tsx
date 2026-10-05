import type { Metadata } from "next";
import Link from "next/link";

import { PlusIcon, WalletIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentTenant, currentUser } from "@/app/lib/api";
import { formatDateTime } from "@/app/lib/format";
import { fetchMembers } from "@/app/lib/members";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.users.title };
}

/**
 * The current tenant's people: members first, then those invited and not yet
 * in. Each row says whether they have an Almena wallet linked — everybody
 * needs one to work in the platform — in a cell of its own between the person
 * and the date; somebody only invited has no account yet, so the cell holds a
 * dash.
 */
export default async function UsersPage() {
  const { locale, t } = await getI18n();
  const copy = t.dashboard.users;
  const [members, tenant, me, timeZone] = await Promise.all([
    fetchMembers(),
    currentTenant(),
    currentUser(),
    getTimeZone(),
  ]);
  const isAdmin = tenant?.role === "admin";

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.lead}</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/users/new">
              <PlusIcon />
              {copy.add}
            </Link>
          </Button>
        )}
      </header>

      {members === null ? (
        <Card className="gap-0 px-5 py-10 text-center">
          <Alert variant="destructive" role="alert">
            <AlertDescription>{copy.errors.unavailable}</AlertDescription>
          </Alert>
        </Card>
      ) : (
        <Card className="gap-0 py-0">
          <ul>
            {members.map((member) => (
              <li
                key={`${member.status}:${member.user_id ?? member.email}`}
                className="flex items-center justify-between gap-4 border-t px-5 py-3.5 first:border-t-0 max-sm:flex-col max-sm:items-start max-sm:gap-1"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">
                    {member.email ?? member.alias ?? copy.noEmail}
                    {member.user_id !== null && member.user_id === me?.id && (
                      <span className="font-normal text-faint">
                        {" "}
                        · {copy.you}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-1.5">
                    <Badge
                      variant={member.role === "admin" ? "brand" : "muted"}
                    >
                      {copy.roles[member.role]}
                    </Badge>
                    {member.status === "invited" && (
                      <Badge variant="pending">{copy.invited}</Badge>
                    )}
                  </span>
                </div>
                <span className="flex-none sm:ml-auto sm:w-40">
                  {member.wallet === null ? (
                    <span className="text-faint" aria-label={copy.noAccount}>
                      —
                    </span>
                  ) : member.wallet ? (
                    <Badge variant="muted">
                      <WalletIcon aria-hidden />
                      {copy.walletLinked}
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <WalletIcon aria-hidden />
                      {copy.noWallet}
                    </Badge>
                  )}
                </span>
                <time
                  className="flex-none text-[13px] text-faint tabular-nums"
                  dateTime={member.since}
                  title={copy.since}
                >
                  {formatDateTime(member.since, locale, timeZone)}
                </time>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
