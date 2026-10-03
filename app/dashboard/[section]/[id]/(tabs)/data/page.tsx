import { notFound } from "next/navigation";

import { fetchMediatorChoices } from "@/app/lib/directory";
import { fetchDomains } from "@/app/lib/domains";
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
  if (loaded.section === "mediators") {
    const url = item.url ?? "";
    const domains = ((await fetchDomains()) ?? [])
      .filter((d) => d.verified)
      .map(({ id, domain }) => ({ id, domain }));
    const at = placed(url, domains);
    return (
      <MediatorForm
        id={item.id}
        name={item.name}
        url={url}
        subdomain={at?.subdomain ?? ""}
        domain={at?.domain}
        domains={domains}
        isPublic={Boolean(item.public)}
      />
    );
  }
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

/**
 * Where `url` sits among the verified `domains`: the subdomain and the domain's
 * id, the longest domain winning; `null` when it is under none of them.
 */
function placed(
  url: string,
  domains: { id: string; domain: string }[],
): { subdomain: string; domain: string } | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  const under = domains
    .filter((d) => host.endsWith(`.${d.domain}`))
    .sort((a, b) => b.domain.length - a.domain.length)[0];
  if (!under) return null;
  return {
    subdomain: host.slice(0, -(under.domain.length + 1)),
    domain: under.id,
  };
}
