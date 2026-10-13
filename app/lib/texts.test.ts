import { describe, expect, it } from "vitest";

import { cleanTexts, hasText, longest, onlyIn, textsFrom } from "./texts";

describe("texts by language", () => {
  it("are trimmed and the empty ones dropped", () => {
    expect(cleanTexts({ en: "  Hello ", es: "   " })).toEqual({ en: "Hello" });
    expect(hasText({ en: " ", es: "" })).toBe(false);
    expect(hasText({ es: "Hola" })).toBe(true);
  });

  it("are read from a hidden input, or none when it is not JSON", () => {
    expect(textsFrom('{"en":" Hi "}')).toEqual({ en: "Hi" });
    expect(textsFrom("not json")).toEqual({});
    expect(textsFrom("[1]")).toEqual({});
    expect(textsFrom(null)).toEqual({});
  });

  it("are held to a limit by the longest", () => {
    expect(longest({ en: "abc", es: "abcde" })).toBe(5);
    expect(longest({})).toBe(0);
  });

  it("keep only the account's languages", () => {
    expect(onlyIn({ en: "Hi", es: "Hola" }, ["en"])).toEqual({ en: "Hi" });
    expect(onlyIn({ en: "Hi", es: "Hola" }, undefined)).toEqual({
      en: "Hi",
      es: "Hola",
    });
  });
});
