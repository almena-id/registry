"use client";

import { useState } from "react";

import { useI18n } from "@/app/i18n/client";
import { setTheme } from "@/app/lib/preferences";
import { themes, type Theme } from "@/app/lib/theme";
import { ChoiceMenu } from "./ChoiceMenu";

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {theme === "system" && <path d="M4 5h16v11H4zM9 20h6M12 16v4" />}
      {theme === "light" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
      {theme === "dark" && <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />}
    </svg>
  );
}

/** Light, dark or the system's: applied at once, remembered in a cookie. */
export function ThemeSwitch({
  initial,
  placement,
}: {
  initial: Theme;
  placement?: "below" | "above";
}) {
  const { t } = useI18n();
  const [theme, setCurrent] = useState<Theme>(initial);

  return (
    <ChoiceMenu<Theme>
      label={t.header.theme}
      icon={<ThemeIcon theme={theme} />}
      value={theme}
      choices={themes.map((option) => ({
        value: option,
        label: t.header.themes[option],
        icon: <ThemeIcon theme={option} />,
      }))}
      placement={placement}
      onSelect={(next) => {
        // Applied at once; the cookie makes the server agree on the next render.
        document.documentElement.dataset.theme = next;
        setCurrent(next);
        void setTheme(next);
      }}
    />
  );
}
