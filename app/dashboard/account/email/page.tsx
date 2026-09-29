import type { Metadata } from "next";

import { getI18n } from "@/app/i18n/server";
import { DetailHead } from "../../[section]/[id]/Detail";
import { EmailLinkForm } from "./EmailLinkForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.dashboard.account.emailLink.title };
}

/** Linking an email: the code sent to it proves it, as when signing in. */
export default async function EmailLinkPage() {
  const { t } = await getI18n();
  const copy = t.dashboard.account;

  return (
    <div>
      <DetailHead back="/dashboard/account" backLabel={copy.title} />
      <EmailLinkForm />
    </div>
  );
}
