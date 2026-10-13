/**
 * What server actions take from Next, for every unit test: cookies with a
 * session in them, `redirect` throwing as Next's does, and English.
 */
import { vi } from "vitest";

import { Redirected } from "./next";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "almena.session" ? { value: "the-session" } : undefined,
    set: () => {},
    delete: () => {},
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/app/i18n/server", () => ({ getLocale: async () => "en" }));
