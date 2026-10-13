import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/app/components/ui/card";
import { WalletScreen } from "@/app/dashboard/WalletScreen";
import { getI18n } from "@/app/i18n/server";
import { fetchTenant } from "@/app/lib/tenant";
import { DetailHead, NotFound } from "../Detail";
import { isKind, ITEM, loadItem } from "../load";
import { PublishForm } from "./PublishForm";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]/[id]/publish">): Promise<Metadata> {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  const { t } = await getI18n();
  const name = loaded?.item?.name ?? "";
  return {
    title: t.dashboard.publication.publishTitle.replace("{name}", name),
  };
}

/**
 * Publishing an issuer, verifier or mediator is endorsing it: the wallet of
 * whoever signs as the tenant signs the tenant's membership credential for it and, in the same
 * approval, its `whois.vp`; then it is published. A screen of its own, like
 * any decision; only for those the tenant's signing flow names. Under the
 * flow `none` nobody's wallet is asked: an admin publishes with a button and
 * the platform signs.
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
  const tenant = await fetchTenant();
  if (item && !tenant?.signs) redirect(back);
  if (!item)
    return (
      <div className="grid gap-4">
        <DetailHead back={`/dashboard/${section}`} backLabel={own.back} />
        <NotFound message={own.notFound} />
      </div>
    );

  if (tenant?.signing_flow === "none")
    return (
      <div className="grid gap-4">
        <DetailHead back={back} backLabel={item.name} />
        <header className="mb-6">
          <h1 className="text-[28px] font-bold tracking-tight break-words">
            {copy.publishTitle.replace("{name}", item.name)}
          </h1>
        </header>
        <Card className="gap-0 p-5">
          <p className="mb-4 text-muted-foreground">{copy.publishLeadNone}</p>
          <PublishForm section={section} id={item.id} />
        </Card>
      </div>
    );

  return (
    <WalletScreen
      back={back}
      backLabel={item.name}
      title={copy.publishTitle.replace("{name}", item.name)}
      lead={copy.publishLead}
      purpose="sign"
      target={{ kind: "endorsement", section, id, back }}
    />
  );
}
