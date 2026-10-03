import { redirect } from "next/navigation";

import { catalogUrl } from "@/app/lib/catalog";

/**
 * Applying for a credential moved to the catalog: an old link to the
 * credentials, or to one offer, goes on there.
 */
export default async function MovedCredentials({
  params,
}: PageProps<"/credentials/[[...path]]">) {
  const { path = [] } = await params;
  const [issuer, type] = path;
  redirect(
    issuer && type
      ? `${catalogUrl()}/credentials/${encodeURIComponent(issuer)}/${encodeURIComponent(type)}`
      : catalogUrl(),
  );
}
