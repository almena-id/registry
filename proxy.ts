import { NextResponse, type NextRequest } from "next/server";

import { contentSecurityPolicy } from "@/app/lib/security-headers";

/**
 * Every page gets a Content Security Policy with a nonce of its own: Next
 * reads it from the request's header and marks its scripts with it (every
 * page is rendered per request: the layout reads the visitor's cookies).
 */
export function proxy(request: NextRequest) {
  // A holder's file carries its own policy (`downloadHeaders`): sandboxed.
  if (
    /^\/dashboard\/applications\/[^/]+\/files\//.test(request.nextUrl.pathname)
  )
    return NextResponse.next();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Not the static files, nor the prefetches of next/link.
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
