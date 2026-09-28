import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { currentTenants } from "@/app/lib/api";
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
  const [loaded, tenants] = await Promise.all([
    loadItem(section, id),
    currentTenants(),
  ]);
  const item = loaded?.item;
  // Only admins delete; anyone else goes back to the item.
  if (item && tenants[0]?.role !== "admin")
    redirect(`/dashboard/${section}/${id}`);

  return (
    <div className="section identity">
      <DetailHead
        back={`/dashboard/${section}/${id}`}
        backLabel={item?.name ?? own.back}
      />
      {!item ? (
        <NotFound message={own.notFound} />
      ) : (
        <>
          <header className="page-head">
            <h1 className="page-head__title">
              {copy.deleteTitle.replace("{name}", item.name)}
            </h1>
          </header>
          <div className="card confirm">
            <p className="confirm__lead">{copy.deleteLead}</p>
            <DeleteForm section={section} id={item.id} />
          </div>
        </>
      )}
    </div>
  );
}
