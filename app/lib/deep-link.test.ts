import { describe, expect, it } from "vitest";

import { safeDeepLink } from "./deep-link";

describe("the wallet's deep link", () => {
  it("keeps the wallet's scheme and https", () => {
    expect(safeDeepLink("almena://request?id=1")).toBe("almena://request?id=1");
    expect(safeDeepLink("https://almena.id/w/1")).toBe("https://almena.id/w/1");
  });

  it("drops any other", () => {
    expect(safeDeepLink("javascript:alert(1)")).toBeNull();
    expect(safeDeepLink(" JavaScript:alert(1)")).toBeNull();
    expect(safeDeepLink("data:text/html,x")).toBeNull();
    expect(safeDeepLink("http://almena.id/w/1")).toBeNull();
    expect(safeDeepLink("/dashboard")).toBeNull();
    expect(safeDeepLink("")).toBeNull();
    expect(safeDeepLink(null)).toBeNull();
  });
});
