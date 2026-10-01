import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getI18n } from "@/app/i18n/server";
import { CreateHeader } from "@/app/dashboard/CreateHeader";
import { fetchMediatorChoices } from "@/app/lib/directory";
import { hasDescription, isSection } from "@/app/lib/directory-types";
import { CreateForm } from "./CreateForm";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[section]/new">): Promise<Metadata> {
  const { section } = await params;
  if (!isSection(section)) return {};
  return { title: (await getI18n()).t.dashboard.sections[section].createTitle };
}

/** Registering something is a decision of its own: it gets its own screen. */
export default async function NewItemPage({
  params,
}: PageProps<"/dashboard/[section]/new">) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const { t } = await getI18n();
  const copy = t.dashboard.sections[section];
  const described = hasDescription(section);
  // Issuers and verifiers pick one of the tenant's mediators.
  const mediators = described ? ((await fetchMediatorChoices()) ?? []) : null;

  return (
    <div>
      <CreateHeader
        section={section}
        title={copy.createTitle}
        lead={copy.createLead}
      />
      <CreateForm
        section={section}
        described={described}
        mediators={mediators}
      />
    </div>
  );
}
