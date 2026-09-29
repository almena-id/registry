import type { Metadata } from "next";

import { getI18n } from "@/app/i18n/server";
import { currentUser, socialProviders } from "@/app/lib/api";
import { fetchWaysIn } from "@/app/lib/ways-in";
import { AccountForm } from "./AccountForm";
import { accountError } from "./errors";
import { WaysIn } from "./WaysIn";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.account.title };
}

/**
 * The signed-in person's own details: an alias, and the ways in — the email
 * and provider accounts linked to the account, added and taken away here.
 */
export default async function AccountPage({
  searchParams,
}: PageProps<"/dashboard/account">) {
  const { t } = await getI18n();
  const copy = t.dashboard.account;
  const query = await searchParams;
  // The layout has already sent anyone signed out to /login.
  const [user, waysIn, providers] = await Promise.all([
    currentUser(),
    fetchWaysIn(),
    socialProviders(),
  ]);
  const error = accountError(query.error);
  const notice = query.moved ? copy.waysIn.moved : query.linked ? copy.waysIn.linked : null;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.lead}</p>
      </header>
      <AccountForm alias={user?.alias ?? ""} />
      <WaysIn
        waysIn={waysIn}
        providers={providers}
        notice={notice}
        error={error ? copy.errors[error] : null}
      />
    </div>
  );
}
