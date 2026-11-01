import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("the security headers", () => {
  it("forbids framing and allows only this origin's nonced scripts", () => {
    const policy = contentSecurityPolicy("abc");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy("abc", true)).toContain("'unsafe-eval'");
  });

  it("sets what every response carries", () => {
    const names = securityHeaders.map((header) => header.key);
    expect(names).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "X-Frame-Options",
      ]),
    );
  });
});
