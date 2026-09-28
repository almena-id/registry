import type { Metadata } from "next";

import { getI18n } from "@/app/i18n/server";
import { currentUser } from "@/app/lib/api";
import { AccountForm } from "./AccountForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.account.title };
}

/** The signed-in person's own details. For now: an alias, beside the email. */
export default async function AccountPage() {
  const { t } = await getI18n();
  // The layout has already sent anyone signed out to /login.
  const user = (await currentUser())!;

  return (
    <div className="section">
      <header className="page-head">
        <h1 className="page-head__title">{t.dashboard.account.title}</h1>
        <p className="page-head__lead">{t.dashboard.account.lead}</p>
      </header>
      <AccountForm email={user.email} alias={user.alias ?? ""} />
    </div>
  );
}
