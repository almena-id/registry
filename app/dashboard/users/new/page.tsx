import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { currentTenant } from "@/app/lib/api";
import { InviteForm } from "./InviteForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.users.inviteTitle };
}

/** Only an admin adds people; anybody else goes back to the list. */
export default async function InvitePage() {
  if ((await currentTenant())?.role !== "admin") redirect("/dashboard/users");
  const { t } = await getI18n();
  const copy = t.dashboard.users;

  return (
    <div>
      <CreateHeader
        section="users"
        title={copy.inviteTitle}
        lead={copy.inviteLead}
      />
      <InviteForm />
    </div>
  );
}
