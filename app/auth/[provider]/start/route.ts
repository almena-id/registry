import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { api, isProviderId } from "@/app/lib/api";
import { oauthStateCookie } from "@/app/lib/session";

/** Asks the API where to send the browser, and remembers the `state` here. */
export async function GET(request: NextRequest, ctx: RouteContext<"/auth/[provider]/start">) {
  const { provider } = await ctx.params;
  const failed = (error: string) =>
    NextResponse.redirect(new URL(`/login?error=${error}`, request.nextUrl));
  if (!isProviderId(provider)) return failed("provider_error");

  const { data, detail } = await api<{ authorization_url: string; state: string }>(
    `/auth/oauth/${provider}/start`,
    { method: "POST" },
  );
  if (!data) return failed(detail ?? "unavailable");

  (await cookies()).set(oauthStateCookie, data.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 600,
  });
  return NextResponse.redirect(data.authorization_url);
}
