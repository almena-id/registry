import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { getI18n } from "@/app/i18n/server";
import { currentTenant } from "@/app/lib/api";
import { fetchValueDomains } from "@/app/lib/value-domains";
import { DomainForm } from "../DomainForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.catalogue.domains.new };
}

/** A value list of Almena's catalogue: only the trust anchor adds them. */
export default async function NewDomainPage({
  searchParams,
}: PageProps<"/dashboard/value-lists/new">) {
  const { from } = await searchParams;
  const tenant = await currentTenant();
  if (!tenant?.anchor) notFound();
  const { t } = await getI18n();
  // A copy of another (`?from={id}`): its words and codes, under a key of its own.
  const original =
    typeof from === "string"
      ? (await fetchValueDomains())?.find((item) => item.id === from)
      : undefined;
  const copy = t.dashboard.catalogue.domains;
  return (
    <div>
      <CreateHeader section="valueLists" title={copy.new} lead={copy.newLead} />
      <DomainForm
        initial={
          original
            ? {
                key: `${original.key}_copy`.slice(0, 64),
                labels: original.labels,
                source: original.source,
                kind: original.codes.some(
                  (code) => typeof code.value === "number",
                )
                  ? "number"
                  : "text",
                codes: original.codes.map((code) => ({
                  value: String(code.value),
                  labels: code.labels,
                  media_type: code.media_type,
                })),
              }
            : {}
        }
      />
    </div>
  );
}
