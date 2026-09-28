import { getI18n } from "@/app/i18n/server";
import { DocumentCard } from "../../Detail";
import { loadItem } from "../../load";

/** JSON: the DID document the item resolves to, as the API publishes it. */
export default async function JsonTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/json">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded?.item) return null;
  const { t } = await getI18n();
  return (
    <DocumentCard
      title={t.dashboard.identity.document}
      hint={t.dashboard.identity.noKeys}
      document={loaded.item.document}
    />
  );
}
