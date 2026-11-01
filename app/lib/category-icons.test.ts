import { TagIcon, UserIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  categoryIcon,
  categoryIconNames,
  isCategoryIcon,
} from "./category-icons";

describe("category icons", () => {
  it("draws a category with its icon", () => {
    expect(categoryIcon("user")).toBe(UserIcon);
  });

  it("falls back to a tag for an unknown or missing name", () => {
    expect(categoryIcon("dragon")).toBe(TagIcon);
    expect(categoryIcon(undefined)).toBe(TagIcon);
    expect(categoryIcon(null)).toBe(TagIcon);
    expect(isCategoryIcon("toString")).toBe(false);
  });

  it("offers the API's 22 icons, the tag first", () => {
    expect(categoryIconNames).toHaveLength(22);
    expect(categoryIconNames[0]).toBe("tag");
  });
});
