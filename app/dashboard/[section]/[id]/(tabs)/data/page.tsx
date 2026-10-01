import { notFound } from "next/navigation";

import { fetchMediatorChoices } from "@/app/lib/directory";
import { DescribedForm } from "../../DescribedForm";
import { loadItem } from "../../load";
import { MediatorForm } from "../../MediatorForm";

/**
 * Data: the fields that change. An issuer's or verifier's name, description
 * and mediator; a mediator's name, address and whether it is public. Any member edits them; the DID
 * stays whatever they become. An identity has no such tab.
 */
export default async function DataTab({
  params,
}: PageProps<"/dashboard/[section]/[id]/data">) {
  const { section, id } = await params;
  const loaded = await loadItem(section, id);
  if (!loaded || loaded.section === "identities") notFound();
  const item = loaded.item;
  if (!item) return null;
  if (loaded.section === "mediators")
    return (
      <MediatorForm
        id={item.id}
        name={item.name}
        url={item.url ?? ""}
        isPublic={Boolean(item.public)}
      />
    );
  return (
    <DescribedForm
      section={loaded.section}
      id={item.id}
      name={item.name}
      description={item.description ?? ""}
      mediator={item.mediator?.id ?? ""}
      mediators={(await fetchMediatorChoices()) ?? []}
    />
  );
}
