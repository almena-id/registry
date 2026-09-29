import "server-only";

import { cookies } from "next/headers";

import { sessionCookie, type SignedIn } from "./api";

/** Keep the API's token for this browser: HTTP-only, on the portal's origin. */
export async function keepSession(signedIn: SignedIn): Promise<void> {
  (await cookies()).set(sessionCookie, signedIn.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(signedIn.expires_at),
  });
}

/** Binds a social sign-in to the browser that started it (login CSRF). */
export const oauthStateCookie = "almena.oauth";

/**
 * A way in being linked belongs to another account: the move ticket the API
 * gave (`noMove` when this account is not empty and cannot move), read by
 * `/dashboard/account/taken`. An empty value would delete the cookie.
 */
export const moveCookie = "almena.move";
export const noMove = "none";

export async function keepMove(ticket: string | null): Promise<void> {
  (await cookies()).set(moveCookie, ticket ?? noMove, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}

/** The social sign-in in flight links a provider to the signed-in account. */
export const oauthLinkCookie = "almena.oauth.link";
