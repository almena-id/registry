import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { DetailHead, NotFound } from "../Detail";
import { DetailTabs } from "../DetailTabs";
import { isKind, ITEM, loadItem } from "../load";
import { ResourceActions } from "../ResourceActions";

export async function generateMetadata({
  params,
}: LayoutProps<"/dashboard/[section]/[id]">): Promise<Metadata> {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded) return {};
  const { t } = await getI18n();
  return { title: loaded.item?.name ?? t.dashboard[ITEM[loaded.section]].back };
}

/**
 * Every item's screens (an identity, an issuer, a verifier, a mediator): the
 * way back, its name with the operations beside it (admins, and not for
 * identities), and the tabs below. The tab shows the rest.
 */
export default async function DetailLayout({
  params,
  children,
}: LayoutProps<"/dashboard/[section]/[id]">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded) notFound();
  const { t } = await getI18n();
  const own = t.dashboard[ITEM[loaded.section]];
  const back = `/dashboard/${section}`;
  const item = loaded.item;

  if (!item)
    return (
      <div className="grid gap-4">
        <DetailHead back={back} backLabel={own.back} />
        <NotFound message={own.notFound} />
      </div>
    );

  const tenant = await currentTenant();
  const admin = tenant?.role === "admin";
  const signs = Boolean(tenant?.signs);
  const resource = isKind(section) && "published_at" in item;

  return (
    <div className="grid gap-4">
      <DetailHead
        back={back}
        backLabel={own.back}
        title={item.name}
        actions={
          resource &&
          (admin || signs) && (
            <ResourceActions
              section={section}
              id={item.id}
              published={Boolean(item.published_at)}
              admin={admin}
              signs={signs}
            />
          )
        }
      />
      <DetailTabs
        base={`${back}/${item.id}`}
        editable={isKind(section)}
        signs={section === "issuers" || section === "verifiers"}
      />
      {children}
    </div>
  );
}
