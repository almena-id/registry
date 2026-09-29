import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { api, isProviderId, sessionCookie } from "@/app/lib/api";
import { oauthLinkCookie, oauthStateCookie } from "@/app/lib/session";

/**
 * Asks the API where to send the browser, and remembers the `state` here.
 * With `?link=1`, the signed-in account is linking the provider (from the
 * account screen) rather than signing in.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/auth/[provider]/start">) {
  const { provider } = await ctx.params;
  const store = await cookies();
  const link = request.nextUrl.searchParams.get("link") === "1";
  const back = link ? "/dashboard/account" : "/login";
  const failed = (error: string) =>
    NextResponse.redirect(new URL(`${back}?error=${error}`, request.nextUrl));
  if (!isProviderId(provider)) return failed("provider_error");

  const token = store.get(sessionCookie)?.value;
  if (link && !token) return NextResponse.redirect(new URL("/login", request.nextUrl));
  const { data, detail } = await api<{ authorization_url: string; state: string }>(
    link ? `/auth/me/accounts/${provider}/start` : `/auth/oauth/${provider}/start`,
    { method: "POST", token: link ? token : undefined },
  );
  if (!data) return failed(detail ?? "unavailable");

  const flow = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 600,
  } as const;
  store.set(oauthStateCookie, data.state, flow);
  if (link) store.set(oauthLinkCookie, "1", flow);
  else store.delete({ name: oauthLinkCookie, path: "/auth" });
  return NextResponse.redirect(data.authorization_url);
}
