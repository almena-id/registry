import { getI18n } from "@/app/i18n/server";
import { DidDocuments } from "../../Detail";
import { loadItem } from "../../load";

/** JSON: the item's DID document — published, to sign, or both. */
export default async function JsonTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/json">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded?.item) return null;
  const { t } = await getI18n();
  return <DidDocuments item={loaded.item} copy={t.dashboard.json} />;
}
