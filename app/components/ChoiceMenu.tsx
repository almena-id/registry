"use client";

import { useRef } from "react";

import { CheckIcon } from "./icons";
import { usePopover } from "./usePopover";

export type Choice<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  lang?: string;
};

/**
 * A ghost trigger with an icon and the current choice, opening a titled,
 * checked list (almena-id/frontend's dropdown shape). `above` opens it over
 * the trigger, for the footer.
 */
export function ChoiceMenu<T extends string>({
  label,
  icon,
  value,
  choices,
  onSelect,
  disabled,
  placement = "below",
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  choices: Choice<T>[];
  onSelect: (value: T) => void;
  disabled?: boolean;
  placement?: "below" | "above";
}) {
  const { open, setOpen, root, trigger } = usePopover();
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const current = choices.find((choice) => choice.value === value);

  function select(next: T) {
    setOpen(false);
    trigger.current?.focus();
    if (next !== value) onSelect(next);
  }

  function onMenuKey(event: React.KeyboardEvent) {
    const index = items.current.findIndex((item) => item === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    items.current[(index + step + choices.length) % choices.length]?.focus();
  }

  return (
    <div className={placement === "above" ? "popover popover--up" : "popover"} ref={root}>
      <button
        ref={trigger}
        type="button"
        className="ghost-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          setOpen(!open);
          // Focus the checked item once the menu is on screen.
          requestAnimationFrame(() =>
            items.current[choices.findIndex((choice) => choice.value === value)]?.focus(),
          );
        }}
      >
        {current?.icon ?? icon}
        <span className="ghost-trigger__text">{current?.label}</span>
      </button>

      {open && (
        <div className="popover__panel popover__panel--menu" role="menu" onKeyDown={onMenuKey}>
          <p className="popover__label">{label}</p>
          <div className="popover__separator" />
          {choices.map((choice, index) => (
            <button
              key={choice.value}
              ref={(node) => {
                items.current[index] = node;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={choice.value === value}
              lang={choice.lang}
              className="popover__item"
              onClick={() => select(choice.value)}
            >
              <span className="popover__check" data-on={choice.value === value}>
                <CheckIcon />
              </span>
              {choice.icon}
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
