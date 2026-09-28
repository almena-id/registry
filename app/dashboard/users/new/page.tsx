import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { currentTenants } from "@/app/lib/api";
import { InviteForm } from "./InviteForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.users.inviteTitle };
}

/** Only an admin adds people; anybody else goes back to the list. */
export default async function InvitePage() {
  if ((await currentTenants())[0]?.role !== "admin")
    redirect("/dashboard/users");
  const { t } = await getI18n();
  const copy = t.dashboard.users;

  return (
    <div className="section">
      <header className="page-head">
        <h1 className="page-head__title">{copy.inviteTitle}</h1>
        <p className="page-head__lead">{copy.inviteLead}</p>
      </header>
      <InviteForm />
    </div>
  );
}
