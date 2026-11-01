/**
 * The headers every response of the portal carries (`next.config.ts`) and
 * the Content Security Policy each page carries (`proxy.ts`, with a nonce of
 * its own per request).
 */

/** Same for every response, static files included. */
export const securityHeaders: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Older browsers, which ignore the policy's frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

/**
 * What a page may load: everything from this origin only — the scripts Next
 * marks with the request's nonce (and what they load, `strict-dynamic`), the
 * self-hosted typefaces, images from here or drawn inline (`data:`, `blob:`).
 * Styles are allowed inline: React and Radix set `style` attributes. No page
 * may be framed — the QR screens could be clickjacked — and nothing is posted
 * anywhere else. Development adds `unsafe-eval`, which React uses there to
 * rebuild server errors' stacks.
 */
export function contentSecurityPolicy(nonce: string, dev = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
