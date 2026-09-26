"use client";

import { useState } from "react";

import { useI18n } from "@/app/i18n/client";
import { setTheme } from "@/app/lib/preferences";
import { themes, type Theme } from "@/app/lib/theme";

const icons: Record<Theme, React.ReactNode> = {
  system: <path d="M4 5h16v11H4zM9 20h6M12 16v4" />,
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
};

export function ThemeSwitch({ initial }: { initial: Theme }) {
  const { t } = useI18n();
  const [theme, setCurrent] = useState<Theme>(initial);

  return (
    <div className="segmented" role="radiogroup" aria-label={t.header.theme}>
      {themes.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={theme === option}
          title={t.header.themes[option]}
          onClick={() => {
            // Applied at once; the cookie makes the server agree on the next render.
            document.documentElement.dataset.theme = option;
            setCurrent(option);
            void setTheme(option);
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {icons[option]}
          </svg>
          <span className="sr-only">{t.header.themes[option]}</span>
        </button>
      ))}
    </div>
  );
}
