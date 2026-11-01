import { describe, expect, it } from "vitest";

import { attachmentDisposition, downloadHeaders } from "./download";

describe("handing on an uploaded file", () => {
  it("is always a download", () => {
    expect(attachmentDisposition(null)).toBe("attachment");
    expect(attachmentDisposition("")).toBe("attachment");
    expect(attachmentDisposition("inline")).toBe("attachment");
    expect(attachmentDisposition('inline; filename="a.pdf"')).toBe(
      'attachment; filename="a.pdf"',
    );
    expect(attachmentDisposition('attachment; filename="a.pdf"')).toBe(
      'attachment; filename="a.pdf"',
    );
    expect(attachmentDisposition("form-data; name=x")).toBe("attachment");
  });

  it("goes out sandboxed and not sniffed", () => {
    const headers = new Headers(
      downloadHeaders(
        new Response("x", {
          headers: {
            "content-type": "text/html",
            "content-disposition": "inline",
          },
        }),
      ),
    );
    expect(headers.get("content-type")).toBe("text/html");
    expect(headers.get("content-disposition")).toBe("attachment");
    expect(headers.get("content-security-policy")).toBe(
      "sandbox; default-src 'none'; frame-ancestors 'none'",
    );
    expect(headers.get("x-content-type-options")).toBe("nosniff");
  });
});
