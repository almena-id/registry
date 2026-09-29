import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { WalletRequest } from "@/app/components/WalletRequest";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { DetailHead, NotFound } from "../Detail";
import { ITEM, loadItem } from "../load";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]/[id]/sign">): Promise<Metadata> {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  const { t } = await getI18n();
  const name = loaded?.item?.name ?? "";
  return { title: t.dashboard.signature.signTitle.replace("{name}", name) };
}

/**
 * Signing an identity's DID — an identity's own, or that of the issuer,
 * verifier or mediator acting as it: the registry prepares the next entry of
 * its did:webvh log and an admin's wallet signs it. A screen of its own, like
 * any decision; admins only.
 */
export default async function SignPage({
  params,
}: PageProps<"/dashboard/[section]/[id]/sign">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded) notFound();
  const { t } = await getI18n();
  const copy = t.dashboard.signature;
  const own = t.dashboard[ITEM[loaded.section]];
  const back = `/dashboard/${section}/${id}`;
  const item = loaded.item;
  if (item && (await currentTenant())?.role !== "admin") redirect(back);
  if (!item)
    return (
      <div className="grid gap-4">
        <DetailHead back={`/dashboard/${section}`} backLabel={own.back} />
        <NotFound message={own.notFound} />
      </div>
    );

  const identityId =
    loaded.section === "identities" || !loaded.item
      ? item.id
      : loaded.item.identity.id;
  return (
    <div className="grid gap-4">
      <DetailHead back={back} backLabel={item.name} />
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {copy.signTitle.replace("{name}", item.name)}
        </h1>
        <p className="text-muted-foreground">
          {item.signature === "pending" ? copy.firstLead : copy.lead}
        </p>
      </header>
      <Card className="max-w-[400px] gap-0 p-6">
        <WalletRequest purpose="sign" target={{ kind: "identity", id: identityId, back }} />
      </Card>
    </div>
  );
}
