"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { dictionaries, type Locale, type Dictionary } from "./config";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

/** Carries the locale the server rendered in to client components. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n was called outside of I18nProvider");
  return value;
}
