/**
 * The API's link to the wallet, if it is one the page may follow: the
 * wallet's own `almena:` scheme or `https:` (a universal link). Anything else
 * (`javascript:`, `data:`, a relative path) is never put in an `href`.
 */
export function safeDeepLink(link: string | null | undefined): string | null {
  if (!link) return null;
  try {
    const { protocol } = new URL(link);
    return protocol === "almena:" || protocol === "https:" ? link : null;
  } catch {
    return null;
  }
}
