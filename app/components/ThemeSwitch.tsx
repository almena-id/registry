"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/app/i18n/client";
import { setTheme } from "@/app/lib/preferences";
import { themes, type Theme } from "@/app/lib/theme";
import { ChoiceMenu } from "./ChoiceMenu";

const icons = { system: MonitorIcon, light: SunIcon, dark: MoonIcon } as const;

function ThemeIcon({ theme }: { theme: Theme }) {
  const Icon = icons[theme];
  return <Icon />;
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
