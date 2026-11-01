import { cookies } from "next/headers";

import { apiRaw, currentTenant, sessionCookie } from "@/app/lib/api";
import { downloadHeaders } from "@/app/lib/download";

/**
 * A file a holder uploaded with an application, for the account's members:
 * fetched from the API with the session (which the browser never holds) and
 * handed on as a sandboxed download, never shown on this origin.
 */
export async function GET(
  _: Request,
  { params }: RouteContext<"/dashboard/applications/[id]/files/[key]">,
) {
  const { id, key } = await params;
  const token = (await cookies()).get(sessionCookie)?.value;
  const tenant = await currentTenant();
  if (!token || !tenant) return new Response(null, { status: 404 });
  const response = await apiRaw(
    `/tenants/${tenant.id}/applications/${encodeURIComponent(id)}/files/${encodeURIComponent(key)}`,
    token,
  );
  if (!response.ok) return new Response(null, { status: response.status });
  return new Response(response.body, { headers: downloadHeaders(response) });
}
