import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/app/components/ui/card";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { DetailHead, NotFound } from "../Detail";
import { isKind, ITEM, loadItem } from "../load";
import { DeleteForm } from "./DeleteForm";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]/[id]/delete">): Promise<Metadata> {
  const { section, id } = await params;
  if (!isKind(section)) return {};
  const { t } = await getI18n();
  const name = (await loadItem(section, id))?.item?.name ?? "";
  return { title: t.dashboard.publication.deleteTitle.replace("{name}", name) };
}

/**
 * Deleting an issuer, verifier or mediator is a decision of its own: it gets
 * its own screen, reached from the trash icon on the item's. Its identity
 * goes with it and its DID stops resolving for good.
 */
export default async function DeletePage({
  params,
}: PageProps<"/dashboard/[section]/[id]/delete">) {
  const { section, id } = await params;
  if (!isKind(section)) notFound();
  const { t } = await getI18n();
  const copy = t.dashboard.publication;
  const own = t.dashboard[ITEM[section]];
  const [loaded, tenant] = await Promise.all([
    loadItem(section, id),
    currentTenant(),
  ]);
  const item = loaded?.item;
  // Only admins delete; anyone else goes back to the item.
  if (item && tenant?.role !== "admin")
    redirect(`/dashboard/${section}/${id}`);

  return (
    <div className="grid gap-4">
      <DetailHead
        back={`/dashboard/${section}/${id}`}
        backLabel={item?.name ?? own.back}
      />
      {!item ? (
        <NotFound message={own.notFound} />
      ) : (
        <>
          <header className="mb-6">
            <h1 className="text-[28px] font-bold tracking-tight">
              {copy.deleteTitle.replace("{name}", item.name)}
            </h1>
          </header>
          <Card className="gap-0 p-5">
            <p className="mb-4 text-muted-foreground">{copy.deleteLead}</p>
            <DeleteForm section={section} id={item.id} />
          </Card>
        </>
      )}
    </div>
  );
}
