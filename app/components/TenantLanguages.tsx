"use client";

import { createContext, useContext } from "react";

import { locales, type Locale } from "@/app/i18n/config";

const Languages = createContext<readonly Locale[]>(locales);

/**
 * The languages the current account works in (`Tenant.languages`), for every
 * text written under it (`MultilingualInput`); all the portal's elsewhere.
 */
export function TenantLanguages({
  languages,
  children,
}: {
  languages: readonly Locale[];
  children: React.ReactNode;
}) {
  return <Languages.Provider value={languages}>{children}</Languages.Provider>;
}

export function useTenantLanguages(): readonly Locale[] {
  return useContext(Languages);
}
