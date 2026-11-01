/**
 * The `Content-Disposition` a file a holder uploaded is handed on with:
 * always a download, never shown inline on this origin, keeping the name the
 * API gave it.
 */
export function attachmentDisposition(given: string | null): string {
  const value = (given ?? "").trim();
  if (/^attachment\b/i.test(value)) return value;
  const rest = value.match(/^inline\b(.*)$/i)?.[1];
  return rest ? `attachment${rest}` : "attachment";
}

/** The headers such a file goes out with: a download, sandboxed, not sniffed. */
export function downloadHeaders(response: Response): HeadersInit {
  return {
    "Content-Type":
      response.headers.get("content-type") ?? "application/octet-stream",
    "Content-Disposition": attachmentDisposition(
      response.headers.get("content-disposition"),
    ),
    // Its own policy (`proxy.ts` leaves these alone): nothing runs, nothing
    // loads, nothing frames it.
    "Content-Security-Policy":
      "sandbox; default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
  };
}
