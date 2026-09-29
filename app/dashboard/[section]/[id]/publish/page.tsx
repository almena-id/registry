import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { WalletRequest } from "@/app/components/WalletRequest";
import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { DetailHead, NotFound } from "../Detail";
import { isKind, ITEM, loadItem } from "../load";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]/[id]/publish">): Promise<Metadata> {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  const { t } = await getI18n();
  const name = loaded?.item?.name ?? "";
  return { title: t.dashboard.publication.publishTitle.replace("{name}", name) };
}

/**
 * Publishing an issuer, verifier or mediator is endorsing it: an admin's
 * wallet signs the tenant's membership credential for it and, in the same
 * approval, its `whois.vp`; then it is published. A screen of its own, like
 * any decision; admins only.
 */
export default async function PublishPage({
  params,
}: PageProps<"/dashboard/[section]/[id]/publish">) {
  const { section, id } = await params;
  if (!isKind(section)) notFound();
  const loaded = await loadItem(section, id);
  const { t } = await getI18n();
  const copy = t.dashboard.publication;
  const own = t.dashboard[ITEM[section]];
  const back = `/dashboard/${section}/${id}`;
  const item = loaded?.item;
  if (item && (await currentTenant())?.role !== "admin") redirect(back);
  if (!item)
    return (
      <div className="grid gap-4">
        <DetailHead back={`/dashboard/${section}`} backLabel={own.back} />
        <NotFound message={own.notFound} />
      </div>
    );

  return (
    <div className="grid gap-4">
      <DetailHead back={back} backLabel={item.name} />
      <header className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">
          {copy.publishTitle.replace("{name}", item.name)}
        </h1>
        <p className="text-muted-foreground">{copy.publishLead}</p>
      </header>
      <Card className="max-w-[400px] gap-0 p-6">
        <WalletRequest
          purpose="sign"
          target={{ kind: "endorsement", section, id, back }}
        />
      </Card>
    </div>
  );
}
