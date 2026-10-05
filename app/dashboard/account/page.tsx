import type { Metadata } from "next";

import { getI18n, getTimeZone } from "@/app/i18n/server";
import { currentUser, socialProviders } from "@/app/lib/api";
import { fetchTokens } from "@/app/lib/tokens";
import { fetchWaysIn } from "@/app/lib/ways-in";
import { AccountForm } from "./AccountForm";
import { accountError } from "./errors";
import { Tokens } from "./Tokens";
import { WaysIn } from "./WaysIn";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.account.title };
}

/**
 * The signed-in person's own details: an alias, the ways in — the email
 * and provider accounts linked to the account, added and taken away here —
 * and the API tokens scripts and the command line use as the account.
 */
export default async function AccountPage({
  searchParams,
}: PageProps<"/dashboard/account">) {
  const { t } = await getI18n();
  const copy = t.dashboard.account;
  const query = await searchParams;
  // The layout has already sent anyone signed out to /login.
  const [user, waysIn, providers, tokens, timeZone] = await Promise.all([
    currentUser(),
    fetchWaysIn(),
    socialProviders(),
    fetchTokens(),
    getTimeZone(),
  ]);
  const error = accountError(query.error);
  const notice = query.moved
    ? copy.waysIn.moved
    : query.linked
      ? copy.waysIn.linked
      : null;

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
      <Tokens tokens={tokens} timeZone={timeZone} />
    </div>
  );
}
