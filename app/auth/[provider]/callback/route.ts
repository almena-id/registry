import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getLocale } from "@/app/i18n/server";
import {
  api,
  isProviderId,
  sessionCookie,
  type LinkResult,
  type SignedIn,
} from "@/app/lib/api";
import {
  keepMove,
  keepSession,
  oauthLinkCookie,
  oauthStateCookie,
} from "@/app/lib/session";

type Context = RouteContext<"/auth/[provider]/callback">;

/**
 * Where a provider sends the browser back. The `state` must be the one this
 * browser was given at the start: otherwise somebody could hand a victim a
 * link that signs them into the sender's account.
 */
export async function GET(request: NextRequest, ctx: Context) {
  const { provider } = await ctx.params;
  const params = request.nextUrl.searchParams;
  const store = await cookies();
  const expected = store.get(oauthStateCookie)?.value;
  const link = store.get(oauthLinkCookie)?.value === "1";
  store.delete({ name: oauthStateCookie, path: "/auth" });
  store.delete({ name: oauthLinkCookie, path: "/auth" });

  const back = link ? "/dashboard/account" : "/login";
  const failed = (error: string) =>
    NextResponse.redirect(new URL(`${back}?error=${error}`, request.nextUrl));
  if (!isProviderId(provider)) return failed("provider_error");
  // The person closed the provider's screen or said no.
  if (params.get("error")) return failed("provider_cancelled");

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || !expected || state !== expected) return failed("invalid_state");

  if (link) {
    const token = store.get(sessionCookie)?.value;
    if (!token) return NextResponse.redirect(new URL("/login", request.nextUrl));
    const { data, detail } = await api<LinkResult>(`/auth/me/accounts/${provider}/callback`, {
      method: "POST",
      body: { code, state },
      token,
    });
    if (!data) return failed(detail ?? "unavailable");
    if (data.status === "linked")
      return NextResponse.redirect(new URL("/dashboard/account?linked=1", request.nextUrl));
    await keepMove(data.move_ticket);
    return NextResponse.redirect(new URL("/dashboard/account/taken", request.nextUrl));
  }

  const { data, detail } = await api<SignedIn>(`/auth/oauth/${provider}/callback`, {
    method: "POST",
    // The language names the tenant a new account starts with.
    body: { code, state, locale: await getLocale() },
  });
  if (!data) return failed(detail ?? "unavailable");
  await keepSession(data);
  return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
}

/**
 * Apple posts its answer (form_post). A cross-site POST does not carry the
 * SameSite=Lax state cookie, so the answer is turned into a GET to the same
 * address, which does.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const target = new URL(request.nextUrl.pathname, request.nextUrl);
  for (const key of ["code", "state", "error"]) {
    const value = form.get(key);
    if (typeof value === "string") target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target, 303);
}
