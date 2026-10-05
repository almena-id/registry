import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { label } from "@/app/lib/form-fields";
import { fetchValueDomains } from "@/app/lib/value-domains";
import { DomainForm } from "../../DomainForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.catalogue.domains.edit };
}

/**
 * Change a value list of Almena's catalogue — only the trust anchor does —,
 * its key and kind fixed; while a field draws on it, it only grows.
 */
export default async function EditDomainPage({
  params,
}: PageProps<"/dashboard/value-lists/[id]/edit">) {
  const { id } = await params;
  const tenant = await currentTenant();
  if (!tenant?.anchor) notFound();
  const [{ t, locale }, domains] = await Promise.all([
    getI18n(),
    fetchValueDomains(),
  ]);
  const item = domains?.find((entry) => entry.id === id);
  if (!item) notFound();
  const copy = t.dashboard.catalogue.domains;
  return (
    <div>
      <CreateHeader
        section="valueLists"
        title={copy.edit}
        lead={copy.editLead
          .replace("{label}", label(item.labels, locale))
          .replace("{count}", String(item.uses))}
      />
      <DomainForm
        edit={item.id}
        initial={{
          key: item.key,
          labels: item.labels,
          source: item.source,
          kind: item.codes.some((code) => typeof code.value === "number")
            ? "number"
            : "text",
          codes: item.codes.map((code) => ({
            value: String(code.value),
            labels: code.labels,
            media_type: code.media_type,
          })),
        }}
      />
    </div>
  );
}
