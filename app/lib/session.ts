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
