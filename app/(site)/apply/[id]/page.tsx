import { redirect } from "next/navigation";

import { catalogUrl } from "@/app/lib/catalog";

/**
 * An application is followed in the catalog now. One started here kept its
 * secret on this origin, which the catalog cannot read: it is started again
 * there.
 */
export default async function MovedApplication({
  params,
}: PageProps<"/apply/[id]">) {
  const { id } = await params;
  redirect(`${catalogUrl()}/apply/${encodeURIComponent(id)}`);
}
