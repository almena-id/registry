import "server-only";

/** The catalog, where holders find offers and apply for credentials. */
export function catalogUrl(): string {
  return (
    process.env.REGISTRY_CATALOG_URL ?? "https://catalog.almena.id"
  ).replace(/\/$/, "");
}
