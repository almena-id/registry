"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { useI18n } from "@/app/i18n/client";
import { localeNames, locales, type Locale } from "@/app/i18n/config";
import { setLocale } from "@/app/lib/preferences";
import { CheckIcon, LanguagesIcon } from "./icons";
import { usePopover } from "./usePopover";

/** The language menu: a ghost trigger with the current language, a checked list. */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { open, setOpen, root, trigger } = usePopover();
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: Locale) {
    setOpen(false);
    trigger.current?.focus();
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  function onMenuKey(event: React.KeyboardEvent) {
    const index = items.current.findIndex((item) => item === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    items.current[(index + step + locales.length) % locales.length]?.focus();
  }

  return (
    <div className="popover" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="ghost-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.header.language}
        disabled={pending}
        onClick={() => {
          setOpen(!open);
          // Focus the checked item once the menu is on screen.
          requestAnimationFrame(() => items.current[locales.indexOf(locale)]?.focus());
        }}
      >
        <LanguagesIcon />
        <span className="ghost-trigger__text">{localeNames[locale]}</span>
      </button>

      {open && (
        <div className="popover__panel popover__panel--menu" role="menu" onKeyDown={onMenuKey}>
          <p className="popover__label">{t.header.language}</p>
          <div className="popover__separator" />
          {locales.map((option, index) => (
            <button
              key={option}
              ref={(node) => {
                items.current[index] = node;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={option === locale}
              lang={option}
              className="popover__item"
              onClick={() => select(option)}
            >
              <span className="popover__check" data-on={option === locale}>
                <CheckIcon />
              </span>
              {localeNames[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
