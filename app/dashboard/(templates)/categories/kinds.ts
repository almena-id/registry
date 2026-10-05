/**
 * The two kinds of category, each a screen of its own: the path segment
 * (`/dashboard/categories/{segment}`) and the kind the API files it as.
 */
export const KINDS = { fields: "field", credentials: "credential" } as const;

export type Segment = keyof typeof KINDS;
export type Kind = (typeof KINDS)[Segment];

export const kindOf = (segment: string): Kind | undefined =>
  Object.hasOwn(KINDS, segment) ? KINDS[segment as Segment] : undefined;

export const segmentOf = (kind?: string): Segment =>
  kind === "credential" ? "credentials" : "fields";
