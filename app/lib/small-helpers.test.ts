import { describe, expect, it } from "vitest";

import { socialError } from "./auth-errors";
import { formatCount } from "./plural";
import { safeBack } from "./status-lists";

describe("going back after signing", () => {
  it("only ever goes to one of the dashboard's paths", () => {
    expect(safeBack("/dashboard/issuers/1", "/dashboard")).toBe(
      "/dashboard/issuers/1",
    );
    expect(safeBack("https://evil.example/dashboard", "/dashboard")).toBe(
      "/dashboard",
    );
    expect(safeBack("//evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeBack("/dashboard/../login", "/dashboard")).toBe("/dashboard");
    expect(safeBack(undefined, "/dashboard")).toBe("/dashboard");
  });
});

describe("a social sign-in's failure", () => {
  it("is worded by its code, unknown ones as unreachable", () => {
    expect(socialError("provider_cancelled")).toBe("providerCancelled");
    expect(socialError("provider_disabled")).toBe("providerError");
    expect(socialError("something")).toBe("unavailable");
    expect(socialError(undefined)).toBeUndefined();
  });
});

describe("a count", () => {
  it("takes the form the locale uses", () => {
    const forms = { one: "{count} claim", other: "{count} claims" };
    expect(formatCount(forms, 1, "en")).toBe("1 claim");
    expect(formatCount(forms, 1200, "en")).toBe("1,200 claims");
    expect(formatCount(forms, 1200, "es")).toBe("1200 claims");
  });
});
