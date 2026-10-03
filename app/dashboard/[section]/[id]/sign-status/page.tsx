import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { WalletRequest } from "@/app/components/WalletRequest";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { fetchStatusLists, safeBack } from "@/app/lib/status-lists";
import { DetailHead, NotFound } from "../Detail";
import { ITEM, loadItem } from "../load";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]/[id]/sign-status">): Promise<Metadata> {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  const { t } = await getI18n();
  const name = loaded?.item?.name ?? "";
  return { title: t.dashboard.statusLists.signTitle.replace("{name}", name) };
}

/**
 * Signing an issuer's status list as it is: its current one (made if it has
 * none, before its first credential), or `list` — one signed with a key its
 * DID no longer lists. The issuer's signer's wallet signs it; signed, it goes
 * back to `back` (a dashboard path: an application waiting to be issued) or
 * to the issuer's Status lists tab. Only for that signer.
 */
export default async function SignStatusPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[section]/[id]/sign-status">) {
  const { section, id } = await params;
  const { list, back: asked } = await searchParams;
  const loaded = await loadItem(section, id);
  if (!loaded || loaded.section !== "issuers") notFound();
  const { t } = await getI18n();
  const copy = t.dashboard.statusLists;
  const own = t.dashboard[ITEM[loaded.section]];
  const item = loaded.item;
  if (!item)
    return (
      <div className="grid gap-4">
        <DetailHead back="/dashboard/issuers" backLabel={own.back} />
        <NotFound message={own.notFound} />
      </div>
    );
  const tab = `/dashboard/issuers/${id}/status`;
  const back = safeBack(typeof asked === "string" ? asked : undefined, tab);
  if (!(await fetchStatusLists(id))?.can_sign) redirect(back);

  return (
    <div className="grid gap-4">
      <DetailHead back={back} backLabel={item.name} />
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {copy.signTitle.replace("{name}", item.name)}
        </h1>
        <p className="text-muted-foreground">{copy.signLead}</p>
      </header>
      <Card className="max-w-[400px] gap-0 p-6">
        <WalletRequest
          purpose="sign"
          target={{
            kind: "status_list",
            issuer: id,
            list: typeof list === "string" ? list : undefined,
            back,
          }}
        />
      </Card>
    </div>
  );
}
