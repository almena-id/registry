import "server-only";

import { cache } from "react";

import {
  fetchDescribed,
  fetchIdentity,
  fetchMediator,
} from "@/app/lib/directory";
import type {
  DescribedDetail,
  IdentityDetail,
  MediatorDetail,
} from "@/app/lib/directory-types";

export type Kind = "issuers" | "verifiers" | "mediators";

export function isKind(section: string): section is Kind {
  return (
    section === "issuers" || section === "verifiers" || section === "mediators"
  );
}

/** The copy block of a section's item: `issuers` → `issuer`, and so on. */
export const ITEM = {
  identities: "identity",
  issuers: "issuer",
  verifiers: "verifier",
  mediators: "mediator",
} as const;

export type Loaded =
  | { section: "identities"; item: IdentityDetail | null }
  | { section: Kind; item: DescribedDetail | MediatorDetail | null };

/**
 * The item a detail screen shows, asked once per request however many of the
 * layout and its tabs want it; `null` for a section that has no such screens.
 */
export const loadItem = cache(
  async (section: string, id: string): Promise<Loaded | null> => {
    if (section === "identities")
      return { section, item: await fetchIdentity(id) };
    if (!isKind(section)) return null;
    const item =
      section === "mediators"
        ? await fetchMediator(id)
        : await fetchDescribed(section, id);
    return { section, item };
  },
);
